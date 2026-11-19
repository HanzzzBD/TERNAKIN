import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Accordion,
  AppNav,
  ArrowRightIcon,
  Badge,
  Banner,
  Button,
  Card,
  Field,
  IconButton,
  MotionToggleButton,
  NumberInput,
  Skeleton,
  UrgencyChip,
} from "./index";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  delete document.documentElement.dataset.motion;
});

describe("Komponen UI dasar", () => {
  it("merender Button utama, sekunder, dan IconButton dengan aria-label", () => {
    const onKlik = vi.fn();
    render(
      <div>
        <Button onClick={onKlik}>Hitung campuran</Button>
        <Button variant="secondary" iconEnd={<ArrowRightIcon />}>
          Lihat toko
        </Button>
        <IconButton aria-label="Segarkan data" icon={<ArrowRightIcon />} />
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Hitung campuran" }));
    expect(onKlik).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Lihat toko" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Segarkan data" })).toBeInTheDocument();
  });

  it("menampilkan Badge dan UrgencyChip dengan ikon dan teks (bukan warna saja)", () => {
    render(
      <div>
        <Badge variant="mitra" />
        <Badge variant="solver" />
        <Badge variant="usang" />
        <Badge variant="offline" />
        <UrgencyChip urgency="rendah" />
        <UrgencyChip urgency="sedang" />
        <UrgencyChip urgency="tinggi" />
      </div>,
    );

    expect(screen.getByText("Toko mitra")).toBeInTheDocument();
    expect(screen.getByText("Dihitung solver")).toBeInTheDocument();
    expect(screen.getByText("Usang")).toBeInTheDocument();
    expect(screen.getByText("Offline")).toBeInTheDocument();
    expect(screen.getByText("Rendah")).toBeInTheDocument();
    expect(screen.getByText("Sedang")).toBeInTheDocument();
    expect(screen.getByText("Tinggi")).toBeInTheDocument();
  });

  it("merender Field dan NumberInput dengan inputmode decimal dan satuan tertulis", () => {
    render(
      <Field id="pakan-kg" label="Pakan terpakai" hint="Total pakan hari ini" error="Wajib diisi">
        <NumberInput id="pakan-kg" unit="kg" hasError placeholder="0" />
      </Field>,
    );

    const input = screen.getByLabelText("Pakan terpakai");
    expect(input).toHaveAttribute("inputmode", "decimal");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("kg")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Wajib diisi");
  });

  it("merender Card, Banner, Skeleton, dan Accordion berbasis details", () => {
    render(
      <Card variant="warm">
        <Banner variant="offline" title="Mode offline">
          Catatan tetap tersimpan di ponsel.
        </Banner>
        <Skeleton variant="text" />
        <Accordion
          items={[
            {
              id: "faq-1",
              question: "Apakah gratis?",
              answer: <p>Gratis untuk peternak.</p>,
            },
          ]}
        />
      </Card>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Mode offline");
    expect(screen.getByText("Apakah gratis?")).toBeInTheDocument();
    expect(screen.getByText("Gratis untuk peternak.")).toBeInTheDocument();
  });

  it("merender AppNav dengan lima tab dan MotionToggleButton yang mengubah data-motion", () => {
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <AppNav variant="bottom" />
        <MotionToggleButton />
      </MemoryRouter>,
    );

    expect(screen.getByRole("navigation", { name: "Navigasi utama" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Beranda" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Pakan" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Catatan" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Kokok" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Toko" })).toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: /Atur animasi/i });
    fireEvent.click(toggle);
    expect(document.documentElement.dataset.motion).toBe("off");
  });
});
