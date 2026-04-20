import { NextFunction, Request, Response } from "express";
import { config } from "./config";

function parseBearerToken(authorizationHeader?: string): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, value] = authorizationHeader.trim().split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value) {
    return null;
  }

  return value;
}

export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const token = parseBearerToken(req.header("Authorization") ?? undefined);
  if (!token || token !== config.apiKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}

export function isSocketAuthorized(authorizationHeader?: string, authToken?: string): boolean {
  const headerToken = parseBearerToken(authorizationHeader);
  const normalizedAuthToken = authToken ? parseBearerToken(authToken) ?? authToken : null;
  return headerToken === config.apiKey || normalizedAuthToken === config.apiKey;
}

