const test = require("node:test");
const assert = require("node:assert/strict");
const {
    LIMITE_IMAGEM_BYTES,
    ImageServiceError,
    detectarTipoImagem,
    validarCotaFree,
    enviarImagem
} = require("../../services/imagemService");

const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);

function freeUsage(percentage = 0.1) {
    return {
        plan: "Free",
        storage: { usage: percentage * 1000, limit: 1000 },
        bandwidth: { usage: percentage * 1000, limit: 1000 },
        transformations: { usage: percentage * 1000, limit: 1000 }
    };
}

test("detects image content from its signature instead of trusting a supplied MIME type", () => {
    assert.equal(detectarTipoImagem(png), "image/png");
    assert.equal(detectarTipoImagem(Buffer.from("not an image")), null);
});

test("rejects images larger than the Cloudinary Free 10 MB limit", async () => {
    await assert.rejects(
        enviarImagem(Buffer.alloc(LIMITE_IMAGEM_BYTES + 1)),
        (error) => error instanceof ImageServiceError && error.status === 413
    );
});

test("fails closed when the provider quota cannot be confirmed", () => {
    assert.throws(
        () => validarCotaFree({ plan: "Free", storage: { usage: 2, limit: 100 } }),
        { code: "image-quota-unavailable" }
    );
    assert.throws(
        () => validarCotaFree({ ...freeUsage(), plan: "Basic" }),
        { code: "image-quota-unavailable" }
    );
});

test("pauses uploads before reaching the configured Free quota limits", () => {
    assert.throws(
        () => validarCotaFree(freeUsage(0.96)),
        { code: "image-quota-exhausted", status: 429 }
    );
    assert.doesNotThrow(() => validarCotaFree(freeUsage(0.94)));
});

test("does not contact Cloudinary before explicit free-plan approval", async () => {
    const previousApproval = process.env.CLOUDINARY_FREE_PLAN_APPROVED;
    delete process.env.CLOUDINARY_FREE_PLAN_APPROVED;
    try {
        await assert.rejects(
            enviarImagem(png),
            { code: "image-storage-not-approved", status: 503 }
        );
    } finally {
        if (previousApproval === undefined) {
            delete process.env.CLOUDINARY_FREE_PLAN_APPROVED;
        } else {
            process.env.CLOUDINARY_FREE_PLAN_APPROVED = previousApproval;
        }
    }
});
