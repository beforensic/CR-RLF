import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database…");

  // Seed a demo module so the first login shows meaningful content.
  // Users are created via Clerk invitation (admin UI) or the admin-bootstrap script.
  const mod = await db.module.upsert({
    where: { slug: "intro-osint" },
    update: {},
    create: {
      slug: "intro-osint",
      title: "Introduction à l'OSINT",
      description:
        "Premiers pas avec les techniques de recherche en sources ouvertes appliquées au Rassemblement des liens familiaux.",
      order: 1,
      isPublished: true,
    },
  });

  const lesson1 = await db.lesson.upsert({
    where: { moduleId_slug: { moduleId: mod.id, slug: "qu-est-ce-que-l-osint" } },
    update: {},
    create: {
      moduleId: mod.id,
      slug: "qu-est-ce-que-l-osint",
      title: "Qu'est-ce que l'OSINT ?",
      order: 1,
      content: `L'OSINT (Open Source Intelligence) désigne la collecte et l'analyse d'informations
issues de sources ouvertes — c'est-à-dire accessibles au public sans contourner
de mesures de sécurité.

**Dans le cadre du Service RLF**, l'OSINT permet de retrouver des membres d'une
même famille séparés par un conflit, une migration ou une catastrophe, en
s'appuyant sur des sources publiquement disponibles (réseaux sociaux, registres,
articles de presse, etc.).

## Principes clés

- Légalité et éthique avant tout
- Protection des données personnelles (RGPD)
- Vérification systématique des sources
- Traçabilité des recherches
`,
    },
  });

  const lesson2 = await db.lesson.upsert({
    where: { moduleId_slug: { moduleId: mod.id, slug: "cadre-juridique" } },
    update: {},
    create: {
      moduleId: mod.id,
      slug: "cadre-juridique",
      title: "Cadre juridique et éthique",
      order: 2,
      content: `Toute recherche OSINT doit respecter un cadre strict :

1. **RGPD** — les données personnelles ne peuvent être collectées que pour une
   finalité légitime, proportionnée et nécessaire.
2. **Consentement** — la personne recherchée doit, dans la mesure du possible,
   être informée.
3. **Minimisation** — ne collecter que ce qui est strictement nécessaire.
4. **Conservation limitée** — effacer les données dès qu'elles ne sont plus utiles.
`,
    },
  });

  await db.quiz.upsert({
    where: { lessonId: lesson2.id },
    update: {},
    create: {
      lessonId: lesson2.id,
      passScore: 70,
      questions: {
        create: [
          {
            prompt: "Quel règlement encadre la collecte de données personnelles en Europe ?",
            type: "single",
            order: 1,
            options: [
              { id: "a", label: "RGPD", isCorrect: true },
              { id: "b", label: "HIPAA", isCorrect: false },
              { id: "c", label: "CCPA", isCorrect: false },
              { id: "d", label: "SOX", isCorrect: false },
            ],
          },
          {
            prompt: "Parmi ces principes, lesquels s'appliquent à l'OSINT ? (plusieurs réponses)",
            type: "multi",
            order: 2,
            options: [
              { id: "a", label: "Minimisation des données", isCorrect: true },
              { id: "b", label: "Conservation illimitée", isCorrect: false },
              { id: "c", label: "Finalité légitime", isCorrect: true },
              { id: "d", label: "Vérification des sources", isCorrect: true },
            ],
          },
        ],
      },
    },
  });

  console.log(`✅ Module « ${mod.title} » créé avec 2 leçons et 1 quiz.`);
  console.log(`   Leçon 1: ${lesson1.slug}`);
  console.log(`   Leçon 2: ${lesson2.slug}`);
  console.log(
    "\nℹ️  Pour créer le premier administrateur : invitez-le via Clerk Dashboard",
  );
  console.log(
    '    (publicMetadata: { "role": "ADMIN" }) puis connectez-vous.',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
