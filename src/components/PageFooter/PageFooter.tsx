export function PageFooter() {
  return (
    <footer className="site-footer">
      <div className="content-shell site-footer__inner">
        <div>
          <p className="site-footer__brand">Afterlife // Community</p>
          <p>Unofficial fan project created for a school assignment.</p>
        </div>
        <div>
          <p className="site-footer__heading">Official image sources</p>
          <a href="https://press.cdprojektred.com/" rel="noreferrer" target="_blank">
            CD PROJEKT RED press center ↗
          </a>
          <a href="https://www.cyberpunk.net/" rel="noreferrer" target="_blank">
            Cyberpunk 2077 official site ↗
          </a>
        </div>
        <p className="site-footer__legal">
          Cyberpunk 2077 and its characters belong to CD PROJEKT RED.
        </p>
      </div>
    </footer>
  )
}
