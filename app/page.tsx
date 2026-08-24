import OrderBuilder from "./order-builder";

const CubeMark = () => (
  <svg aria-hidden="true" viewBox="0 0 32 32" className="brand-mark">
    <path d="m16 2 12 7v14l-12 7L4 23V9l12-7Z" fill="currentColor" />
    <path d="m16 2 12 7-12 7L4 9l12-7Z" fill="#ff8066" />
    <path d="m16 16 12-7v14l-12 7V16Z" fill="#9c7cff" />
    <path d="m16 16-12-7v14l12 7V16Z" fill="#66e7c4" />
  </svg>
);

const ArrowIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" className="arrow-icon">
    <path d="M4 10h11m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
  </svg>
);

const CheckIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" className="check-icon">
    <path d="m5 10 3 3 7-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="VoxelMe home">
          <CubeMark />
          <span>VoxelMe</span>
        </a>
        <div className="header-actions">
          <span className="header-price"><strong>$15</strong> flat</span>
          <a className="button button-small" href="#order">Make mine</a>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span className="status-dot" /> Custom-made in 24 hours</p>
          <h1>Your favorite photo,<br /><em>reimagined in voxels.</em></h1>
          <p className="hero-lede">
            Send a photo of you, your pet, or your favorite duo. Get a one-of-one voxel portrait made for sharing, gifting, and keeping.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#order">
              Start my portrait — $15 <ArrowIcon />
            </a>
            <a className="text-link" href="#included">See what you get</a>
          </div>
          <div className="trust-row" aria-label="Offer details">
            <span><CheckIcon /> No crypto</span>
            <span><CheckIcon /> One revision</span>
            <span><CheckIcon /> Two sizes</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-glow" />
          <figure className="portrait-card">
            <img src="https://voxelme-15.voxel-vault-5748.chatgpt.site/voxelme-hero.webp" alt="A person and golden retriever recreated as detailed voxel art" />
            <figcaption>
              <span><i /> Made for you</span>
              <strong>One of one</strong>
            </figcaption>
          </figure>
          <div className="floating-tag tag-top">Person or pet</div>
          <div className="floating-tag tag-bottom">Ready to share</div>
        </div>
      </section>

      <section className="proof-strip" aria-label="Simple order process">
        <p>One photo</p><span>→</span><p>One quick brief</p><span>→</span><p>One custom portrait</p>
      </section>

      <section className="included-preview" id="included">
        <div>
          <p className="section-kicker">The complete mini pack</p>
          <h2>One small price.<br />A genuinely personal result.</h2>
        </div>
        <ul className="included-list">
          <li><span>01</span><div><strong>Custom portrait</strong><small>Built around your photo and vibe</small></div></li>
          <li><span>02</span><div><strong>Two useful sizes</strong><small>Square post + phone wallpaper</small></div></li>
          <li><span>03</span><div><strong>One revision</strong><small>A small tweak, included</small></div></li>
        </ul>
      </section>

      <section className="process-section">
        <div className="section-heading">
          <p className="section-kicker">How it works</p>
          <h2>From camera roll<br />to custom art.</h2>
        </div>
        <div className="process-grid">
          <article><span>01</span><h3>Tell us the vibe</h3><p>Choose a subject, a mood, and add any details that make the portrait feel like yours.</p></article>
          <article><span>02</span><h3>Send your photos</h3><p>Your email app opens with the brief ready. Attach one to three clear photos and press send.</p></article>
          <article><span>03</span><h3>Approve your portrait</h3><p>We confirm the brief and payment, then send your finished files within 24 hours.</p></article>
        </div>
      </section>

      <section className="order-section" id="order">
        <div className="order-intro">
          <p className="section-kicker">Make yours</p>
          <h2>Build your $15 portrait brief.</h2>
          <p>It takes about a minute. Your email app opens at the end so you can attach the photos.</p>
          <div className="promise-card">
            <span>Exactly what is included</span>
            <ul>
              <li><CheckIcon /> One custom portrait</li>
              <li><CheckIcon /> Square + wallpaper files</li>
              <li><CheckIcon /> One small revision</li>
              <li><CheckIcon /> Personal-use rights</li>
            </ul>
          </div>
        </div>
        <OrderBuilder />
      </section>

      <section className="faq-section">
        <div>
          <p className="section-kicker">Good to know</p>
          <h2>Questions,<br />answered plainly.</h2>
        </div>
        <div className="faq-list">
          <details open><summary>Do I need crypto or an NFT wallet?<span>+</span></summary><p>No. This is a normal custom digital-art order. No crypto, wallet, or technical setup is involved.</p></details>
          <details><summary>What photos work best?<span>+</span></summary><p>Send one to three clear, well-lit photos where the face or pet is easy to see. Different angles help, but are not required.</p></details>
          <details><summary>What does “one revision” cover?<span>+</span></summary><p>One small change such as a color, background detail, or expression tweak. A completely new subject or concept would be a new order.</p></details>
          <details><summary>How will I receive the files?<span>+</span></summary><p>We email a high-resolution square image and a phone-friendly wallpaper file within 24 hours after your brief and payment are confirmed.</p></details>
        </div>
      </section>

      <section className="closing-cta">
        <CubeMark />
        <p>One photo. One day. One of one.</p>
        <h2>Your next favorite portrait is $15 away.</h2>
        <a className="button button-primary" href="#order">Make mine <ArrowIcon /></a>
      </section>

      <footer>
        <a className="brand" href="#top"><CubeMark /><span>VoxelMe</span></a>
        <p>Custom voxel portraits, made personally.</p>
        <a href="mailto:hartensteindominic@gmail.com">Questions? Email Dominic</a>
      </footer>
    </main>
  );
}
