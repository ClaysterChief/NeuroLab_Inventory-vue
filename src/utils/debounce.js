/**
 * Retrasa la ejecución de fn hasta que pasen `delay` ms
 * sin que se vuelva a llamar. Reduce peticiones HTTP al buscar.
 */
export function debounce(fn, delay = 300) {
  let timer
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}