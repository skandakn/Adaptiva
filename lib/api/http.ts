import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400, code = "bad_request") {
  return NextResponse.json({ error: { message, code } }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return fail("Invalid request payload.", 422, "validation_error");
  }
  return fail("Something went wrong while processing the request.", 500, "internal_error");
}
