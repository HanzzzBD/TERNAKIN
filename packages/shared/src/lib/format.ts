const formatBilanganBulat = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

export function formatRupiah(nilai: number): string {
  const dibulatkan = Math.round(nilai);
  const negatif = dibulatkan < 0;
  const teksAngka = formatBilanganBulat.format(Math.abs(dibulatkan));
  return negatif ? `-Rp ${teksAngka}` : `Rp ${teksAngka}`;
}

export function formatAngka(nilai: number, desimalMaks = 1): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: desimalMaks,
  }).format(nilai);
}

export function formatPersen(nilai: number, desimalMaks = 1): string {
  return `${formatAngka(nilai, desimalMaks)}%`;
}
