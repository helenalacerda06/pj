const test = require("node:test");
const assert = require("node:assert/strict");
const { gerenciarAdmin } = require("../../scripts/gerenciarAdmin");

test("grant preserves existing Firebase custom claims", async () => {
    let claimsSaved;
    const auth = {
        async getUser() {
            return { customClaims: { beta: true } };
        },
        async setCustomUserClaims(_uid, claims) {
            claimsSaved = claims;
        }
    };

    await gerenciarAdmin(auth, "grant", "uid-a");

    assert.deepEqual(claimsSaved, { beta: true, admin: true });
});

test("revoke removes admin claim and revokes refresh tokens", async () => {
    let claimsSaved;
    let revokedUid;
    const auth = {
        async getUser() {
            return { customClaims: { admin: true, beta: true } };
        },
        async setCustomUserClaims(_uid, claims) {
            claimsSaved = claims;
        },
        async revokeRefreshTokens(uid) {
            revokedUid = uid;
        }
    };

    await gerenciarAdmin(auth, "revoke", "uid-a");

    assert.deepEqual(claimsSaved, { beta: true });
    assert.equal(revokedUid, "uid-a");
});
