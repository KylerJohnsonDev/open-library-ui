import { computed, Signal } from '@angular/core';
import { signalStoreFeature, withState, withComputed } from '@ngrx/signals';

export type RequestStatus = 'idle' | 'pending' | 'success' | 'error';

export interface RequestStatusState {
  requestStatus: RequestStatus;
  requestError: string | null;
}

type KeyedState<K extends string> = Record<`${K}RequestStatus`, RequestStatus> &
  Record<`${K}RequestError`, string | null>;

type KeyedComputed<K extends string> = Record<`${K}IsPending`, Signal<boolean>> &
  Record<`${K}IsSuccess`, Signal<boolean>> &
  Record<`${K}IsError`, Signal<boolean>>;

// No-key overload — fully typed
export function withRequestStatus(): ReturnType<typeof createNoKeyFeature>;
// Keyed overload — state/computed properties are dynamically named per key
export function withRequestStatus<K extends string>(
  key: K
): ReturnType<typeof createKeyedFeature<K>>;
export function withRequestStatus(key?: string) {
  return key ? createKeyedFeature(key) : createNoKeyFeature();
}

function createNoKeyFeature() {
  return signalStoreFeature(
    withState<RequestStatusState>({ requestStatus: 'idle', requestError: null }),
    withComputed(({ requestStatus }) => ({
      isPending: computed(() => requestStatus() === 'pending'),
      isSuccess: computed(() => requestStatus() === 'success'),
      isError: computed(() => requestStatus() === 'error'),
    }))
  );
}

function createKeyedFeature<K extends string>(key: K) {
  return signalStoreFeature(
    withState<KeyedState<K>>({
      [`${key}RequestStatus`]: 'idle',
      [`${key}RequestError`]: null,
    } as KeyedState<K>),
    withComputed((store) => {
      const s = store as Record<string, Signal<unknown>>;
      return {
        [`${key}IsPending`]: computed(() => s[`${key}RequestStatus`]() === 'pending'),
        [`${key}IsSuccess`]: computed(() => s[`${key}RequestStatus`]() === 'success'),
        [`${key}IsError`]: computed(() => s[`${key}RequestStatus`]() === 'error'),
      } as KeyedComputed<K>;
    })
  );
}

// --- Helper functions ---

export function setPending(): RequestStatusState;
export function setPending<K extends string>(key: K): KeyedState<K>;
export function setPending(key?: string): RequestStatusState | Record<string, unknown> {
  if (key) return { [`${key}RequestStatus`]: 'pending' as RequestStatus, [`${key}RequestError`]: null };
  return { requestStatus: 'pending' as RequestStatus, requestError: null };
}

export function setSuccess(): RequestStatusState;
export function setSuccess<K extends string>(key: K): KeyedState<K>;
export function setSuccess(key?: string): RequestStatusState | Record<string, unknown> {
  if (key) return { [`${key}RequestStatus`]: 'success' as RequestStatus, [`${key}RequestError`]: null };
  return { requestStatus: 'success' as RequestStatus, requestError: null };
}

export function setError(error: string): RequestStatusState;
export function setError<K extends string>(key: K, error: string): KeyedState<K>;
export function setError(keyOrError: string, error?: string): RequestStatusState | Record<string, unknown> {
  if (error !== undefined) {
    return {
      [`${keyOrError}RequestStatus`]: 'error' as RequestStatus,
      [`${keyOrError}RequestError`]: error,
    };
  }
  return { requestStatus: 'error' as RequestStatus, requestError: keyOrError };
}
