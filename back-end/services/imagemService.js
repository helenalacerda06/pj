const cloudinary = require("cloudinary").v2;

const LIMITE_IMAGEM_BYTES = 10 * 1024 * 1024;
const RESERVA_COTA_FREE = 0.05;
const METRICAS_COTA_FREE = ["storage", "bandwidth", "transformations"];

class ImageServiceError extends Error {
    constructor(message, code, status) {
        super(message);
        this.name = "ImageServiceError";
        this.code = code;
        this.status = status;
    }
}

function detectarTipoImagem(buffer) {
    if (
        buffer.length >= 8 &&
        buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    ) {
        return "image/png";
    }
    if (buffer.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) {
        return "image/jpeg";
    }
    if (
        buffer.length >= 6 &&
        ["GIF87a", "GIF89a"].includes(buffer.toString("ascii", 0, 6))
    ) {
        return "image/gif";
    }
    if (
        buffer.length >= 12 &&
        buffer.toString("ascii", 0, 4) === "RIFF" &&
        buffer.toString("ascii", 8, 12) === "WEBP"
    ) {
        return "image/webp";
    }
    return null;
}

function configurarCloudinary() {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        throw new ImageServiceError(
            "Image storage is not configured.",
            "image-storage-not-configured",
            503
        );
    }

    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
        secure: true
    });
}

function validarCotaFree(uso) {
    if (typeof uso?.plan !== "string" || uso.plan.toLowerCase() !== "free") {
        throw new ImageServiceError(
            "Could not verify the approved Cloudinary Free quota.",
            "image-quota-unavailable",
            503
        );
    }

    for (const metrica of METRICAS_COTA_FREE) {
        const utilizados = Number(uso[metrica]?.usage);
        const limite = Number(uso[metrica]?.limit);
        if (!Number.isFinite(utilizados) || !Number.isFinite(limite) || limite <= 0) {
            throw new ImageServiceError(
                "Could not verify the approved Cloudinary Free quota.",
                "image-quota-unavailable",
                503
            );
        }
        if (utilizados / limite >= 1 - RESERVA_COTA_FREE) {
            throw new ImageServiceError(
                "Image uploads are paused to preserve the Cloudinary Free quota.",
                "image-quota-exhausted",
                429
            );
        }
    }
}

async function verificarCotaFree() {
    if (process.env.CLOUDINARY_FREE_PLAN_APPROVED !== "true") {
        throw new ImageServiceError(
            "Cloudinary Free has not been approved for uploads.",
            "image-storage-not-approved",
            503
        );
    }
    configurarCloudinary();
    let usage;
    try {
        usage = await cloudinary.api.usage();
    } catch (erro) {
        const erroQuota = new ImageServiceError(
            "Could not verify the approved Cloudinary Free quota.",
            "image-quota-unavailable",
            503
        );
        erroQuota.cause = erro;
        throw erroQuota;
    }
    validarCotaFree(usage);
}

async function enviarImagem(buffer, publicId) {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw new ImageServiceError("Image file is empty or invalid.", "invalid-image", 400);
    }
    if (buffer.length > LIMITE_IMAGEM_BYTES) {
        throw new ImageServiceError("Image exceeds the 10 MB limit.", "image-too-large", 413);
    }
    if (!detectarTipoImagem(buffer)) {
        throw new ImageServiceError("Image type is invalid.", "invalid-image", 400);
    }

    await verificarCotaFree();
    return new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream(
                publicId
                    ? { public_id: publicId, overwrite: true, resource_type: "image" }
                    : { folder: "lac-star/avaliacoes", resource_type: "image" },
                (erro, resultado) => {
                    if (erro) {
                        const erroUpload = new ImageServiceError(
                            "Image provider upload failed.",
                            "image-provider-failed",
                            503
                        );
                        erroUpload.cause = erro;
                        return reject(erroUpload);
                    }
                    if (!resultado?.secure_url || !resultado?.public_id) {
                        return reject(new ImageServiceError(
                            "Image provider returned an invalid response.",
                            "image-provider-invalid-response",
                            503
                        ));
                    }
                    return resolve({
                        url: resultado.secure_url,
                        publicId: resultado.public_id
                    });
                }
            )
            .end(buffer);
    });
}

async function excluirImagem(publicId) {
    if (!publicId) {
        return;
    }
    configurarCloudinary();
    const resultado = await cloudinary.uploader.destroy(publicId, {
        invalidate: true,
        resource_type: "image"
    });
    if (resultado.result !== "ok" && resultado.result !== "not found") {
        throw new Error("Cloudinary image cleanup failed.");
    }
}

module.exports = {
    LIMITE_IMAGEM_BYTES,
    ImageServiceError,
    detectarTipoImagem,
    validarCotaFree,
    enviarImagem,
    excluirImagem
};
