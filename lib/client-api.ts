"use client";

export type ApiPayload = {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
};

export async function readApiResponse<T extends ApiPayload = ApiPayload>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      response.status === 504
        ? "模型回應時間過長，請稍後重試。"
        : "伺服器未回傳內容，請重新整理頁面後再試。"
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      response.ok
        ? "伺服器回傳格式異常，請重新整理頁面後再試。"
        : `伺服器請求失敗 (${response.status})，請稍後再試。`
    );
  }
}
