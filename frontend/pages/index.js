import Head from "next/head";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import FeatureBanner from "@/components/FeatureBanner";

export default function Home() {
  // DELIBERATE CI FAILURE (Del 3): syntax error must fail lint + build
  const DELIBERATE_BREAK_FOR_CI_TEST === ;
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
        <FeatureBanner />
      </main>
    </>
  );
}
