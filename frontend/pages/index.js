import Head from "next/head";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Head>
        <title>Banken</title>
        <meta name="description" content="Bankens webbplats" />
      </Head>
      <nav>
        <Link href="/">Hem</Link>
        <Link href="/login">Logga in</Link>
        <Link href="/register">Skapa användare</Link>
      </nav>
      <main>
        <div className="hero">
          <h1>Välkommen till Banken</h1>
          <p>Härlig online bank :-)</p>
          <Link href="/register">Skapa användare</Link>
        </div>
      </main>
    </>
  );
}
