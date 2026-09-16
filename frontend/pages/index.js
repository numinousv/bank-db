import Head from "next/head";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <>
      <Head>
        <title>Bank</title>
        <meta name="description" content="The bank website" />
      </Head>
      <Navbar />
      <main>
        <div className="hero">
          <h1>Welcome to the Bank</h1>
          <p>Banking site of sorts :-)</p>
          <Link href="/register">Create account</Link>
        </div>
      </main>
    </>
  );
}
