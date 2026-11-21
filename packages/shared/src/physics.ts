import RAPIER from "@dimforge/rapier3d-compat";

let rapierInitPromise: Promise<typeof RAPIER> | null = null;

export async function initRapier(): Promise<typeof RAPIER> {
  if (!rapierInitPromise) {
    rapierInitPromise = RAPIER.init()
      .then(() => RAPIER)
      .catch((err: unknown) => {
        rapierInitPromise = null;
        throw err;
      });
  }
  return rapierInitPromise;
}

export { RAPIER };
