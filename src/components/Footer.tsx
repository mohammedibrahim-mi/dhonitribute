import { gallery } from "@/data/gallery";
import { sources } from "@/data/sources";
import { site } from "@/data/site";

export default function Footer() {
  const factSources = [sources.cricinfoProfile, sources.icc, sources.ipl, sources.retirement2020];
  const research = [sources.book, sources.emaPartners, sources.crickatha];

  return (
    <footer id="about" className="foot light">
      <div className="foot-grid grid12">
        <div className="foot-col">
          <p className="eyebrow2">A fan-made tribute</p>
          <p>
            Independent and unofficial. Not created, approved or endorsed by MS Dhoni, the BCCI, Chennai Super Kings,
            the ICC or any sponsor.
          </p>
        </div>
        <div className="foot-col">
          <p className="eyebrow2">Sources</p>
          <ul>
            {factSources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="foot-col">
          <p className="eyebrow2">Research leads</p>
          <ul>
            {research.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.name.split(" — ")[0]}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="foot-col">
          <p className="eyebrow2">Built by</p>
          <p className="foot-credit">{site.creditName}</p>
          <a href="#home">Back to top ↑</a>
        </div>
      </div>

      <details className="foot-credits grid12">
        <summary>Image credits ({gallery.length})</summary>
        <ul>
          {gallery.map((g) => (
            <li key={g.id}>
              <span>{g.caption}</span>
              <span>{g.credit}</span>
              <span>{g.licence}</span>
            </li>
          ))}
        </ul>
      </details>

      <p className="foot-wordmark" aria-hidden="true">
        {"DHONI".split("").map((c, i) => (
          <span key={i}>{c}</span>
        ))}
      </p>
    </footer>
  );
}
