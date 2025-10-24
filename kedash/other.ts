
export const getQueryParams = <T extends string>(keys: T[]) => {
  if (!keys || !Array.isArray(keys) || keys.length === 0) {
    console.error(
      `[GetQueryParams Error]: keys must be a non-empty array of strings`
    )
    return {} as Record<T, string | undefined>
  }

  const searchParams = new URLSearchParams(window.location.search)
  const params = keys.reduce(
    (res, key) => {
      const param = searchParams.get(key)

      if (param) {
        res[key] = param
      } else {
        res[key] = undefined
      }

      return res
    },
    {} as Record<T, string | undefined>
  )

  return params
}

export const setQueryParams = (params: Record<string, any>) => {
  if (!params || params?.constructor !== Object) {
    console.error(`[SetQueryParams Error]: params must be an object`)
    return
  }

  const keys = Object.entries(params)
  if (keys.length === 0) {
    console.error(`[SetQueryParams Error]: params must be a non-empty object`)
    return
  }

  const searchParams = new URLSearchParams(window.location.search)
  for (const [param, value] of keys) {
    if (
      value === null ||
      value === undefined ||
      (typeof value === 'string' && !value.trim())
    ) {
      continue
    }

    searchParams.set(param, String(value))
  }

  const queryString = searchParams.toString()
  const newUrl = queryString ? `?${queryString}` : window.location.pathname

  window.history.replaceState({}, '', newUrl)
}

interface ParseOptions {
  normalize?: boolean
}

export const tryParse = (str: string, fallback: any = null, options: ParseOptions = {}) => {
  try {
    const result = JSON.parse(str);
    if (!!result) {
      return options.normalize ? normalizeJSON(result) : result;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export const normalizeJSON = obj => {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => {
    if (v === 'true') return [k, true]
    if (v === 'false') return [k, false]
    if (v === 'null') return [k, null]
    if (v === 'undefined') return [k, undefined]
    return [k, v]
  }))
}
