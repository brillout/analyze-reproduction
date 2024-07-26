import fs from 'fs'

await main()

type PackageJson = {
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
}

// https://api.npmjs.org/downloads/point/last-week/vike
type NpmStatDownloads =
  | {
      downloads: number
    }
  // https://api.npmjs.org/downloads/point/last-week/i-dont-exist
  | {
      error: string
    }

async function main() {
  const packageJson = readJson('package.json') as PackageJson

  const deps = await Promise.all(
    [...Object.keys(packageJson.dependencies || {}), ...Object.keys(packageJson.devDependencies || {})].map(
      async (name) => {
        const ret = (await fetchJson(`https://api.npmjs.org/downloads/point/last-week/${name}`)) as NpmStatDownloads
        let downloads = 'downloads' in ret ? ret.downloads : 0
        return {
          name,
          downloads,
        }
      },
    ),
  )

  deps.sort(higherFirst(({ downloads }) => downloads))

  console.log(deps)
}

function readJson(filePath: string): unknown {
  return JSON.parse(String(fs.readFileSync(filePath)))
}

async function fetchJson(url: string): Promise<unknown> {
  const resp = await fetch(url)
  const respJson = await resp.json()
  return respJson
}

/**
 * ```js
 * let arr = [
 *   { price: 10 },
 *   { price: 1000 },
 *   { price: 100 }
 * ]
 * arr = arr.sort(higherFirst(el => el.price))
 * isEqual(arr, [
 *   { price: 1000 },
 *   { price: 100 },
 *   { price: 10 }
 * ])
 * ```
 */
function higherFirst<T>(getValue: (element: T) => number): (element1: T, element2: T) => 0 | 1 | -1 {
  return (element1: T, element2: T) => {
    const val1 = getValue(element1)
    const val2 = getValue(element2)
    if (val1 === val2) {
      return 0
    }
    return val1 > val2 ? -1 : 1
  }
}
