/*
  Página de download do SKOLĒ.
  - A conta da VA2 (a mesma do app, modelo Padrão).
  - Os botões apontam sozinhos para a última versão publicada (API do GitHub);
    sem a API, ficam no link das releases, que também funciona.
  - "O que mudou" vem das últimas releases.
  - Entrada das seções ao rolar (sem script, tudo aparece normalmente).
*/
const REPO = 'clatzao/praxis-atualizacoes'

// A conta: VA1 vale 30, OATs 40, VA2 30, passa com 70; acima disso, final.
const conta = document.querySelector('[data-conta]')
if (conta) {
  const va1 = conta.querySelector('[data-va1]')
  const oat = conta.querySelector('[data-oat]')
  const saida = conta.querySelector('[data-saida]')
  const ler = (el, max) => Math.min(max, Math.max(0, Number(String(el.value).replace(',', '.')) || 0))
  const fmt = (n) => (Math.round(n * 10) / 10).toLocaleString('pt-BR')
  const atualizar = () => {
    const falta = 70 - ler(va1, 30) - ler(oat, 40)
    saida.textContent =
      falta <= 0
        ? 'Você já passou, mesmo zerando a VA2.'
        : falta > 30
          ? `Nem com 30 na VA2: faltariam ${fmt(falta - 30)}. O SKOLĒ já monta o plano da final.`
          : `Você precisa de ${fmt(falta)} na VA2.`
  }
  va1.addEventListener('input', atualizar)
  oat.addEventListener('input', atualizar)
  atualizar()
}

// O botão do aparelho de quem abre vem primeiro.
const ua = navigator.userAgent
const acoes = document.querySelector('[data-acoes]')
if (acoes && /Windows NT/.test(ua) && !/Android/.test(ua)) {
  const [android, windows] = [acoes.querySelector('[data-baixar="android"]'), acoes.querySelector('[data-baixar="windows"]')]
  acoes.prepend(windows)
  windows.classList.remove('claro')
  android.classList.add('claro')
}
// iPhone, iPad e Mac não têm instalador: a versão do navegador vem primeiro.
if (acoes && /iPhone|iPad|Macintosh/.test(ua)) {
  const web = acoes.querySelector('[data-web]')
  acoes.prepend(web)
  web.classList.remove('claro')
  acoes.querySelector('[data-baixar="android"]')?.classList.add('claro')
}

const mb = (bytes) => `${(bytes / 1048576).toLocaleString('pt-BR', { maximumFractionDigits: bytes > 50e6 ? 0 : 1 })} MB`
const data = (iso) => new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
const escapar = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

fetch(`https://api.github.com/repos/${REPO}/releases?per_page=3`, { headers: { Accept: 'application/vnd.github+json' } })
  .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
  .then((versoes) => {
    const ultima = versoes.find((v) => !v.draft && !v.prerelease)
    if (!ultima) return
    const arquivo = (fim) => ultima.assets.find((a) => a.name.endsWith(fim))
    const apk = arquivo('.apk')
    const exe = arquivo('.exe')
    for (const [tipo, a] of [['android', apk], ['windows', exe]]) {
      if (!a) continue
      document.querySelectorAll(`[data-baixar="${tipo}"]`).forEach((link) => (link.href = a.browser_download_url))
      document.querySelectorAll(`[data-tamanho="${tipo === 'android' ? 'apk' : 'exe'}"]`).forEach((el) => (el.textContent = mb(a.size)))
    }
    const versao = document.querySelector('[data-versao]')
    if (versao) versao.textContent = `Versão ${ultima.name || ultima.tag_name.replace(/^v/, '')}, de ${data(ultima.published_at)}. Android 7 ou mais novo, Windows 10 ou 11, ou direto no navegador.`

    // "O que mudou": cada linha "- ..." do texto da release vira um item.
    const lista = document.querySelector('[data-novidades]')
    if (lista) {
      lista.innerHTML = versoes
        .filter((v) => !v.draft && !v.prerelease)
        .slice(0, 3)
        .map((v) => {
          const itens = (v.body || '').split(/\r?\n/).map((l) => l.replace(/^\s*-\s*/, '').trim()).filter(Boolean)
          return `<div><h3>${escapar(v.name || v.tag_name)}<span>${data(v.published_at)}</span></h3><ul>${itens.map((i) => `<li>${escapar(i)}</li>`).join('')}</ul></div>`
        })
        .join('')
    }
  })
  .catch(() => {
    // Sem a API (limite de acessos ou sem internet): os links das releases continuam valendo.
  })

// Entrada das partes de cada seção, uma vez só.
const surgem = document.querySelectorAll('.surge')
if ('IntersectionObserver' in window) {
  const olho = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue
        e.target.classList.add('visto')
        olho.unobserve(e.target)
      }
    },
    { rootMargin: '0px 0px -8% 0px' }
  )
  surgem.forEach((el) => olho.observe(el))
} else {
  surgem.forEach((el) => el.classList.add('visto'))
}
