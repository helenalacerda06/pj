import { apiRequest, getApiBaseUrl, validarApiUrl, ApiError } from "./api";
import { auth } from "../firebase/config";

jest.mock("../firebase/config", () => ({
  auth: { currentUser: null }
}));

describe("API client", () => {
  const originalApiUrl = process.env.REACT_APP_API_URL;
  const originalFetch = global.fetch;

  afterEach(() => {
    process.env.REACT_APP_API_URL = originalApiUrl;
    global.fetch = originalFetch;
    auth.currentUser = null;
    jest.clearAllMocks();
  });

  test("requires an environment-specific absolute API URL", () => {
    delete process.env.REACT_APP_API_URL;
    expect(() => getApiBaseUrl()).toThrow("REACT_APP_API_URL must be configured");

    process.env.REACT_APP_API_URL = "relative/path";
    expect(() => getApiBaseUrl()).toThrow("valid absolute URL");
    expect(() => validarApiUrl("http://localhost:3002", true))
      .toThrow("must not point to localhost");
    expect(() => validarApiUrl("http://api.example.test", true))
      .toThrow("must not point to localhost");
  });

  test("attaches Firebase ID token to authenticated requests", async () => {
    process.env.REACT_APP_API_URL = "https://api.example.test/";
    auth.currentUser = { getIdToken: jest.fn().mockResolvedValue("id-token") };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ uid: "uid-a" })
    });

    await expect(apiRequest("/usuario/firebase")).resolves.toEqual({ uid: "uid-a" });
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe("https://api.example.test/usuario/firebase");
    expect(options.headers.get("Authorization")).toBe("Bearer id-token");
  });

  test("rejects authenticated requests without a Firebase session", async () => {
    process.env.REACT_APP_API_URL = "https://api.example.test";

    await expect(apiRequest("/usuario/firebase"))
      .rejects.toMatchObject({ status: 401 });
    expect(global.fetch).toBe(originalFetch);
  });

  test("preserves API status and explicit server error message", async () => {
    process.env.REACT_APP_API_URL = "https://api.example.test";
    auth.currentUser = { getIdToken: jest.fn().mockResolvedValue("id-token") };
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => JSON.stringify({ mensagem: "Acesso negado." })
    });

    await expect(apiRequest("/admin/usuarios"))
      .rejects.toMatchObject({
        name: new ApiError("Acesso negado.", 403).name,
        message: "Acesso negado.",
        status: 403
      });
  });
});
