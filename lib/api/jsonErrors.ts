import { NextResponse } from 'next/server';

export function unauthorizedJson(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenJson(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function badRequestJson(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/** Generic server error — do not leak internal details to clients. */
export function serverErrorJson() {
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export function notConfiguredJson() {
  return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
}
