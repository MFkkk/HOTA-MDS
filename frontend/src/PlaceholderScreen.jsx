function PlaceholderScreen({ route }) {
  return (
    <main className="placeholder-shell">
      <section className="placeholder-band">
        <p className="eyebrow">HOTA MDS</p>
        <h1>{route.title}</h1>
        <p>{route.subtitle}</p>
        <div className="quick-links" aria-label="基础路由">
          <a href="/screen/left">/screen/left</a>
          <a href="/screen/right">/screen/right</a>
          <a href="/admin/login">/admin/login</a>
          <a href="/admin/console">/admin/console</a>
        </div>
      </section>
    </main>
  );
}

export default PlaceholderScreen;
