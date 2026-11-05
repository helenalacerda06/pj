const crypto = require("node:crypto");

const CATEGORY_ALIASES = new Map([["Serie", "Série"]]);

function stableId(type, sourceId) {
    const digest = crypto
        .createHash("sha256")
        .update(`${type}:${sourceId}`)
        .digest("hex")
        .slice(0, 40);
    return `legacy_${digest}`;
}

function validDate(value) {
    if (typeof value !== "string" || !value.trim()) {
        return null;
    }
    const normalized = value.trim();
    const calendarDate = /^(\d{4}-\d{2}-\d{2})(?:[ T]|$)/.exec(normalized)?.[1];
    if (calendarDate && validDateField(calendarDate) === null) {
        return null;
    }
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
}

function validRating(value) {
    if (value === null || value === undefined || value === "") {
        return 0;
    }
    const rating = Number(value);
    return Number.isFinite(rating)
        && rating >= 0
        && rating <= 5
        && Number.isInteger(rating * 2)
        ? rating
        : null;
}

function validDateField(value) {
    if (value === null || value === undefined || value === "") {
        return "";
    }
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return null;
    }
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value
        ? null
        : value;
}

function validDuration(value) {
    if (value === null || value === undefined || value === "") {
        return "";
    }
    if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
        return null;
    }
    return value;
}

function normalizeCategory(value) {
    const category = CATEGORY_ALIASES.get(value) || value;
    return ["Filme", "Série", "Livro"].includes(category) ? category : null;
}

function buildMigrationPlan({ users, reviews, links, authUsers, fallbackDate = new Date() }) {
    const migrationDate = new Date(fallbackDate);
    if (Number.isNaN(migrationDate.getTime())) {
        throw new TypeError("A valid fallback date is required for migration planning.");
    }

    const exceptions = [];
    const accountByEmail = new Map();
    for (const account of authUsers) {
        if (!account.email || account.emailVerified !== true) {
            continue;
        }
        const email = account.email.trim().toLowerCase();
        const matches = accountByEmail.get(email) || [];
        matches.push(account);
        accountByEmail.set(email, matches);
    }

    const userIdsByEmail = new Map();
    for (const user of users) {
        if (!user.email || !user.email.trim()) {
            continue;
        }
        const email = user.email.trim().toLowerCase();
        const ids = userIdsByEmail.get(email) || [];
        ids.push(user.id);
        userIdsByEmail.set(email, ids);
    }

    const uidByLegacyUserId = new Map();
    const profiles = [];
    for (const user of users) {
        const email = typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
        const legacyDuplicates = userIdsByEmail.get(email) || [];
        const accounts = accountByEmail.get(email) || [];
        let reason = null;
        if (!email) {
            reason = "USER_EMAIL_MISSING";
        } else if (legacyDuplicates.length !== 1) {
            reason = "LEGACY_EMAIL_AMBIGUOUS";
        } else if (accounts.length !== 1) {
            reason = accounts.length ? "FIREBASE_EMAIL_AMBIGUOUS" : "VERIFIED_FIREBASE_ACCOUNT_NOT_FOUND";
        } else if (typeof user.nome !== "string" || !user.nome.trim()) {
            reason = "USER_NAME_MISSING";
        } else if (validDateField(user.aniversario) === null) {
            reason = "INVALID_BIRTHDAY";
        }

        if (reason) {
            exceptions.push({ entity: "user", sourceId: String(user.id), reason });
            continue;
        }

        const uid = accounts[0].uid;
        uidByLegacyUserId.set(String(user.id), uid);
        exceptions.push({
            entity: "user",
            sourceId: String(user.id),
            reason: "CREATED_AT_UNAVAILABLE_IMPORT_TIMESTAMP_USED"
        });
        profiles.push({
            sourceId: String(user.id),
            uid,
            nome: user.nome.trim(),
            email: accounts[0].email,
            aniversario: typeof user.aniversario === "string" ? user.aniversario : ""
        });
    }

    const linksByReviewId = new Map();
    for (const link of links) {
        const reviewId = String(link.id_avaliacao);
        const rows = linksByReviewId.get(reviewId) || [];
        rows.push(link);
        linksByReviewId.set(reviewId, rows);
    }

    const reviewByLegacyId = new Map();
    const plannedReviews = [];
    for (const review of reviews) {
        const sourceId = String(review.id);
        const reviewLinks = linksByReviewId.get(sourceId) || [];
        const allOwnersMapped = reviewLinks.every((link) =>
            uidByLegacyUserId.has(String(link.id_usuario))
        );
        const ownerUids = [...new Set(reviewLinks
            .map((link) => uidByLegacyUserId.get(String(link.id_usuario)))
            .filter(Boolean))];
        let reason = null;
        if (!reviewLinks.length) {
            reason = "REVIEW_LINK_MISSING";
        } else if (!allOwnersMapped) {
            reason = "UNRESOLVED_REVIEW_OWNER";
        } else if (ownerUids.length !== 1) {
            reason = ownerUids.length ? "MULTIPLE_VERIFIED_OWNERS" : "VERIFIED_OWNER_NOT_FOUND";
        }

        const category = normalizeCategory(review.categoria);
        const rating = validRating(review.estrelas);
        const releaseDate = validDateField(review.lancamento);
        const duration = validDuration(review.duracao);
        const parsedLinks = reviewLinks
            .map((link) => ({ link, date: validDate(link.data_criacao) }))
            .filter((entry) => entry.date)
            .sort((left, right) => left.date - right.date);
        if (!reason && !category) {
            reason = "UNSUPPORTED_CATEGORY";
        } else if (!reason && rating === null) {
            reason = "INVALID_RATING";
        } else if (!reason && releaseDate === null) {
            reason = "INVALID_RELEASE_DATE";
        } else if (!reason && duration === null) {
            reason = "INVALID_DURATION";
        }

        if (reason) {
            exceptions.push({ entity: "review", sourceId, reason });
            continue;
        }

        const dataCriacao = parsedLinks[0]?.date || migrationDate;
        if (parsedLinks.length === 0) {
            exceptions.push({
                entity: "review",
                sourceId,
                reason: "CREATION_DATE_FALLBACK_USED",
                originalDates: reviewLinks.map((link) => ({
                    sourceId: String(link.id ?? link.rowid),
                    value: link.data_criacao ?? null
                })),
                fallbackDate: migrationDate.toISOString()
            });
        }

        const documentId = stableId("review", sourceId);
        const plannedReview = {
            id: documentId,
            sourceId,
            usuarioUid: ownerUids[0],
            nome: typeof review.nome === "string" ? review.nome : "",
            descricao: typeof review.descricao === "string" ? review.descricao : "",
            feedback: typeof review.feedback === "string" ? review.feedback : "",
            principais_pontos: typeof review.principais_pontos === "string"
                ? review.principais_pontos
                : "",
            imagemOriginal: typeof review.imagem === "string" ? review.imagem : "",
            categoria: category,
            estrelas: rating,
            lancamento: releaseDate,
            duracao: duration,
            dataCriacao
        };
        plannedReviews.push(plannedReview);
        reviewByLegacyId.set(sourceId, plannedReview);
    }

    const plannedLinks = [];
    for (const link of links) {
        const sourceId = String(link.id ?? link.rowid);
        const review = reviewByLegacyId.get(String(link.id_avaliacao));
        const uid = uidByLegacyUserId.get(String(link.id_usuario));
        const date = validDate(link.data_criacao);
        let reason = null;
        if (!uid) {
            reason = "VERIFIED_USER_NOT_FOUND";
        } else if (!review) {
            reason = "REVIEW_NOT_ELIGIBLE";
        } else if (review.usuarioUid !== uid) {
            reason = "LINK_OWNER_MISMATCH";
        } else if (!date) {
            reason = "INVALID_CREATION_DATE";
        }

        if (reason) {
            exceptions.push({
                entity: "link",
                sourceId,
                reason,
                ...(reason === "INVALID_CREATION_DATE"
                    ? { originalDate: link.data_criacao ?? null }
                    : {})
            });
            continue;
        }
        plannedLinks.push({
            id: stableId("link", sourceId),
            sourceId,
            usuarioUid: uid,
            avaliacaoId: review.id,
            dataCriacao: date
        });
    }

    const imageReviews = plannedReviews.filter((review) => review.imagemOriginal);
    const plannedReviewIds = new Set(plannedReviews.map((review) => review.sourceId));
    for (const review of reviews) {
        if (
            typeof review.imagem === "string" &&
            review.imagem &&
            !plannedReviewIds.has(String(review.id))
        ) {
            exceptions.push({
                entity: "image",
                sourceId: String(review.id),
                reason: "REVIEW_NOT_ELIGIBLE"
            });
        }
    }
    return {
        profiles,
        reviews: plannedReviews,
        links: plannedLinks,
        imageReviews,
        exceptions,
        normalizations: {
            categorySerieToSérie: reviews.filter((review) => review.categoria === "Serie").length
        },
        sourceCounts: {
            users: users.length,
            reviews: reviews.length,
            links: links.length,
            images: reviews.filter((review) => typeof review.imagem === "string" && review.imagem).length
        }
    };
}

module.exports = { buildMigrationPlan, stableId };
