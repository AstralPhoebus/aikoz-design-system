import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { BookingFlow } from "./booking-flow";
import { Button } from "../button/button";

const jours = [
  { label: "Mardi 14 avril", slots: [
    { value: "a1", time: "09:00" }, { value: "a2", time: "09:30", full: true }, { value: "a3", time: "10:00" },
  ]},
];

const meta = {
  title: "Parcours/BookingFlow",
  component: BookingFlow,
  tags: ["autodocs"],
  args: { days: jours, trigger: <Button>Réserver une démonstration</Button> },
} satisfies Meta<typeof BookingFlow>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Formulaire: Story = { name: "Formulaire", args: { open: true } };

export const LaValidationSeFaitALaSoumission: Story = {
  name: "La validation se fait à la soumission",
  args: { open: true },
  play: async ({ canvas, userEvent }) => {
    const dialogue = document.querySelector("[role=dialog]") as HTMLElement;
    const confirmer = [...dialogue.querySelectorAll("button")].find((b) => /Confirmer/.test(b.textContent ?? ""))!;
    await userEvent.click(confirmer);
    // Trois erreurs, chacune en role=alert puisqu'elles apparaissent après coup.
    await expect(dialogue.querySelectorAll("[role=alert]")).toHaveLength(3);
    await expect(dialogue.querySelectorAll("[aria-invalid='true']")).toHaveLength(2);
  },
  parameters: {
    docs: {
      description: {
        story:
          "Jamais à la frappe : corriger quelqu'un pendant qu'il écrit affiche une erreur " +
          "dès le premier caractère. Et la règle de l'e-mail est volontairement permissive " +
          "— on refuse l'absence d'arobase ou de domaine, pas les formes inhabituelles.",
      },
    },
  },
};

export const LeFocusVaAuPremierChampFautif: Story = {
  name: "Le focus va au premier champ fautif",
  args: { open: true },
  parameters: {
    docs: {
      description: {
        story:
          "Signaler les erreurs ne suffit pas : il faut emmener à la première. " +
          "Avant cette correction, le clic sur « Confirmer » laissait le focus " +
          "**sur le bouton**, faisait partir **trois `role=\"alert\"` en même " +
          "temps** — les lecteurs d'écran en font la queue ou en perdent — et " +
          "il ne restait plus qu'à remonter le formulaire à tâtons.\n\n" +
          "L'ordre suivi est celui du formulaire, pas celui de l'objet " +
          "d'erreurs : on emmène au **premier** problème que l'utilisateur " +
          "rencontrerait en lisant.\n\n" +
          "Pour le choix du créneau, le focus ne va pas sur le `<fieldset>` — " +
          "il ne le prend pas, et le lui donner ferait annoncer le groupe sans " +
          "dire quoi faire — mais sur le premier créneau **sélectionnable**. " +
          "Emmener sur un créneau complet serait emmener dans une impasse.",
      },
    },
  },
  play: async ({ userEvent }) => {
    const dialogue = document.querySelector("[role=dialog]") as HTMLElement;
    const confirmer = [...dialogue.querySelectorAll("button")].find((b) =>
      /Confirmer/.test(b.textContent ?? ""),
    )!;

    // 1. Tout est vide : le premier fautif est « Nom ».
    await userEvent.click(confirmer);
    const nom = dialogue.querySelector<HTMLInputElement>("input[autocomplete='name']")!;
    await expect(document.activeElement).toBe(nom);

    // 2. Le nom rempli, c'est l'e-mail qui devient le premier fautif.
    await userEvent.type(nom, "Camille Brun");
    await userEvent.click(confirmer);
    const email = dialogue.querySelector<HTMLInputElement>("input[autocomplete='email']")!;
    await expect(document.activeElement).toBe(email);

    // 3. Les deux remplis, il reste le créneau : le focus va au premier
    //    créneau LIBRE — pas au `<fieldset>`, pas au créneau complet.
    await userEvent.type(email, "camille.brun@neoassur.fr");
    await userEvent.click(confirmer);
    const libres = [
      ...dialogue.querySelectorAll<HTMLInputElement>("input[type=radio]:not([disabled])"),
    ];
    await expect(document.activeElement).toBe(libres[0]);
    await expect((document.activeElement as HTMLInputElement).disabled).toBe(false);
  },
};

export const ObligatoireEtFacultatifSontDitsTousLesDeux: Story = {
  name: "Obligatoire et facultatif sont dits tous les deux",
  args: { open: true },
  parameters: {
    docs: {
      description: {
        story:
          "*Practical UI* (chapitre 8) demande qu'on marque les champs " +
          "obligatoires **ou** les facultatifs, et qu'on ne laisse jamais " +
          "deviner. Ici les deux sont dits, parce que le formulaire mélange " +
          "les deux cas.\n\n" +
          "« (facultatif) » est **visible**, pas `sr-only` : qui voit l'écran " +
          "a exactement le même besoin de savoir qu'il peut passer son chemin. " +
          "L'astérisque des obligatoires, elle, reste décorative — " +
          "`aria-hidden` — et l'obligation est dite en toutes lettres à côté, " +
          "parce qu'un symbole seul ne porte pas l'information.\n\n" +
          "Avant, « Facultatif » était noyé dans la phrase d'aide du champ " +
          "Établissement : l'information y était, mais c'était une habitude " +
          "de ce formulaire-là, pas une règle du système.",
      },
    },
  },
  play: async ({ canvas }) => {
    const dialogue = document.querySelector("[role=dialog]") as HTMLElement;
    const etiquettes = [...dialogue.querySelectorAll("label")];

    const facultatifs = etiquettes.filter((l) => /\(facultatif\)/.test(l.textContent ?? ""));
    await expect(facultatifs).toHaveLength(1);
    await expect(facultatifs[0].textContent).toContain("Établissement");

    const obligatoires = etiquettes.filter((l) => /\(obligatoire\)/.test(l.textContent ?? ""));
    await expect(obligatoires).toHaveLength(2);

    // Aucun champ ne porte les deux marqueurs : `required` l'emporte.
    for (const l of etiquettes) {
      const t = l.textContent ?? "";
      await expect(/\(obligatoire\)/.test(t) && /\(facultatif\)/.test(t)).toBe(false);
    }

    // Le marqueur est VISIBLE, pas réservé aux lecteurs d'écran.
    const marqueur = facultatifs[0].querySelector("span:not([aria-hidden])")!;
    await expect(canvas).toBeTruthy();
    const boite = (marqueur as HTMLElement).getBoundingClientRect();
    await expect(boite.width).toBeGreaterThan(20);
  },
};

export const Confirme: Story = {
  name: "Confirmé",
  args: { open: true, status: "confirmed" },
  parameters: {
    docs: {
      description: {
        story:
          "Le changement d'état est ANNONCÉ et reçoit le FOCUS. Deux mécanismes, parce " +
          "qu'ils ne servent pas la même personne : `role=\"status\"` prévient qui écoute, " +
          "le focus déplacé emmène qui navigue au clavier. Sans le focus, l'utilisateur " +
          "resterait sur un bouton « Confirmer » qui n'existe plus.",
      },
    },
  },
};

export const Echec: Story = {
  name: "Échec",
  args: { open: true, status: "failed" },
  parameters: {
    docs: {
      description: {
        story:
          "Le message dit quoi faire, pas seulement que ça a raté. Ce composant ne parle " +
          "à personne : ni serveur ni `fetch`, l'appelant passe un `status` et reçoit un " +
          "`onSubmit`.",
      },
    },
  },
};
