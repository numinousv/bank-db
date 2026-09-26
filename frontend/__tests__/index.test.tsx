/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import Home from "@/pages/index";

describe("Home", () => {
  it("renders a heading", () => {
    render(<Home />);

    const heading = screen.getByRole("heading", {
      name: /welcome to the bank/i,
    });

    expect(heading).toBeInTheDocument();
  });

  it("has navigation links", () => {
    render(<Home />);

    expect(screen.getByRole("link", { name: /^home$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /login/i })).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /create account/i }).length,
    ).toBeGreaterThanOrEqual(2);
  });
});
