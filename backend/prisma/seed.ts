import { PrismaClient, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

export const STANDARD_CATEGORIES = [
  // 5 Despesas Essenciais (type = EXPENSE, isEssential = true)
  { name: 'Moradia', type: TransactionType.EXPENSE, isEssential: true },
  { name: 'Alimentação', type: TransactionType.EXPENSE, isEssential: true },
  { name: 'Transporte', type: TransactionType.EXPENSE, isEssential: true },
  { name: 'Saúde', type: TransactionType.EXPENSE, isEssential: true },
  { name: 'Educação', type: TransactionType.EXPENSE, isEssential: true },

  // 4 Despesas Adicionais (type = EXPENSE, isEssential = false)
  { name: 'Dívidas e cartão de crédito', type: TransactionType.EXPENSE, isEssential: false },
  { name: 'Lazer', type: TransactionType.EXPENSE, isEssential: false },
  { name: 'Cuidados pessoais', type: TransactionType.EXPENSE, isEssential: false },
  { name: 'Outras despesas', type: TransactionType.EXPENSE, isEssential: false },

  // 5 Receitas Padrão (type = INCOME, isEssential = false)
  { name: 'Salário', type: TransactionType.INCOME, isEssential: false },
  { name: 'Investimentos', type: TransactionType.INCOME, isEssential: false },
  { name: 'Pensão/auxílio', type: TransactionType.INCOME, isEssential: false },
  { name: 'Dividendos', type: TransactionType.INCOME, isEssential: false },
  { name: 'Outras receitas', type: TransactionType.INCOME, isEssential: false },
];

export const EDUCATIONAL_LESSONS = [
  {
    orderIndex: 1,
    title: 'Receitas, Despesas e Fluxo de Caixa',
    summary: 'Entenda para onde vai o seu dinheiro e aprenda a enxergar a diferença entre o que entra e o que sai.',
    cards: [
      {
        orderIndex: 1,
        title: 'O que é Dinheiro Entrando e Saindo?',
        content: 'Dinheiro que entra na sua conta é chamado de Receita (como seu salário, pensão ou renda extra). Dinheiro que sai para pagar as contas é Despesa. A diferença entre eles é o seu Saldo.',
      },
      {
        orderIndex: 2,
        title: 'Sem Julgamentos!',
        content: 'No CatFinance, não julgamos com o que você gasta. O primeiro passo para a tranquilidade financeira é apenas ter clareza: saber exatamente quanto entrou e quanto saiu no mês.',
      },
      {
        orderIndex: 3,
        title: 'Reflexão Pessoal',
        content: 'Pense por um momento: você costuma saber exatamente quanto sobra ou falta no final do mês antes de consultar o extrato? (Essa resposta é só para você refletir).',
      },
    ],
    questions: [
      {
        orderIndex: 1,
        prompt: 'Se você recebeu R$ 2.000 de salário e gastou R$ 1.600 no mês, qual é o seu saldo final?',
        options: [
          { id: 'opt_1', text: 'Saldo positivo de R$ 400' },
          { id: 'opt_2', text: 'Saldo negativo de R$ 400' },
          { id: 'opt_3', text: 'Saldo zerado' },
        ],
        correctOptionId: 'opt_1',
      },
      {
        orderIndex: 2,
        prompt: 'Qual é o objetivo principal de anotar suas despesas?',
        options: [
          { id: 'opt_1', text: 'Ter clareza e previsibilidade sobre para onde seu dinheiro vai' },
          { id: 'opt_2', text: 'Sentir culpa por ter comprado algo que você gosta' },
          { id: 'opt_3', text: 'Nunca mais poder sair com amigos' },
        ],
        correctOptionId: 'opt_1',
      },
      {
        orderIndex: 3,
        prompt: 'O que é uma receita financeira?',
        options: [
          { id: 'opt_1', text: 'Qualquer valor que entra no seu orçamento (salário, comissões, vendas)' },
          { id: 'opt_2', text: 'Um boleto enviado pelo banco' },
          { id: 'opt_3', text: 'Um comprovante de farmácia' },
        ],
        correctOptionId: 'opt_1',
      },
    ],
  },
  {
    orderIndex: 2,
    title: 'A Importância dos 5 Gastos Essenciais',
    summary: 'Descubra por que Moradia, Alimentação, Transporte, Saúde e Educação são a base de sustentação da sua vida.',
    cards: [
      {
        orderIndex: 1,
        title: 'A Pirâmide da Tranquilidade',
        content: 'Os 5 gastos essenciais são aqueles vitais para sua sobrevivência e desenvolvimento: Moradia, Alimentação, Transporte, Saúde e Educação. Priorizá-los protege seu bem-estar básico.',
      },
      {
        orderIndex: 2,
        title: 'E se eu não tiver um deles?',
        content: 'Não tem problema! Se você não paga aluguel ou mora com a família, basta declarar "Não tenho esse gasto". A meta é mapear sua realidade sem complicação.',
      },
      {
        orderIndex: 3,
        title: 'Reflexão Pessoal',
        content: 'Qual das 5 despesas essenciais costuma pesar mais no seu bolso todo mês?',
      },
    ],
    questions: [
      {
        orderIndex: 1,
        prompt: 'Quais são as 5 despesas essenciais consideradas no CatFinance?',
        options: [
          { id: 'opt_1', text: 'Moradia, Alimentação, Transporte, Saúde e Educação' },
          { id: 'opt_2', text: 'Streaming, Roupas, Restaurantes, Cinema e Jogos' },
          { id: 'opt_3', text: 'Impostos, Juros, Dívidas, Multas e Cartório' },
        ],
        correctOptionId: 'opt_1',
      },
      {
        orderIndex: 2,
        prompt: 'O que fazer caso você não tenha uma das 5 despesas essenciais no mês (por exemplo, estuda com bolsa 100%)?',
        options: [
          { id: 'opt_1', text: 'Usar o botão "Não tenho esse gasto" para mapear sua realidade' },
          { id: 'opt_2', text: 'Inventar um valor qualquer de R$ 0,01' },
          { id: 'opt_3', text: 'Desistir de usar o aplicativo' },
        ],
        correctOptionId: 'opt_1',
      },
      {
        orderIndex: 3,
        prompt: 'Por que priorizamos os gastos essenciais no planejamento financeiro?',
        options: [
          { id: 'opt_1', text: 'Porque garantem as necessidades básicas de vida e segurança da sua família' },
          { id: 'opt_2', text: 'Porque o banco exige isso em contrato' },
          { id: 'opt_3', text: 'Para sobrar mais dinheiro para apostas' },
        ],
        correctOptionId: 'opt_1',
      },
    ],
  },
  {
    orderIndex: 3,
    title: 'O Impacto dos Gastos Recorrentes',
    summary: 'Aprenda a mapear assinaturas e contas fixas para evitar surpresas no início de cada mês.',
    cards: [
      {
        orderIndex: 1,
        title: 'Gastos que se Repetem',
        content: 'Contas fixas mensais (aluguel, condomínio, internet, streamings, mensalidades) acontecem todo mês no mesmo dia. Mapeá-las com antecedência traz paz de espírito.',
      },
      {
        orderIndex: 2,
        title: 'O Efeito "Gota d\'Água"',
        content: 'Pequenas assinaturas esquecidas de R$ 19,90, R$ 29,90 e R$ 49,90 podem somar mais de R$ 1.500 no ano. Revisar o que você realmente usa ajuda a economizar sem sofrimento.',
      },
      {
        orderIndex: 3,
        title: 'Reflexão Pessoal',
        content: 'Você já pagou por um serviço por vários meses mesmo sem utilizá-lo com frequência?',
      },
    ],
    questions: [
      {
        orderIndex: 1,
        prompt: 'O que é uma despesa recorrente?',
        options: [
          { id: 'opt_1', text: 'Um gasto previsível que se repete periodicamente (ex: aluguel, internet)' },
          { id: 'opt_2', text: 'Um conserto imprevisto do carro' },
          { id: 'opt_3', text: 'Um presente comprado no aniversário de um amigo' },
        ],
        correctOptionId: 'opt_1',
      },
      {
        orderIndex: 2,
        prompt: 'Qual a vantagem de cadastrar um gasto como recorrente no CatFinance?',
        options: [
          { id: 'opt_1', text: 'O sistema sugere importá-lo automaticamente nos próximos meses com 1 clique' },
          { id: 'opt_2', text: 'O banco paga a conta de graça para você' },
          { id: 'opt_3', text: 'O valor da despesa diminui automaticamente' },
        ],
        correctOptionId: 'opt_1',
      },
      {
        orderIndex: 3,
        prompt: 'Como evitar que assinaturas não utilizadas corroam seu orçamento?',
        options: [
          { id: 'opt_1', text: 'Revisar periodicamente suas assinaturas e cancelar o que não usa mais' },
          { id: 'opt_2', text: 'Nunca mais usar cartão de crédito' },
          { id: 'opt_3', text: 'Pagar apenas o mínimo da fatura do cartão' },
        ],
        correctOptionId: 'opt_1',
      },
    ],
  },
  {
    orderIndex: 4,
    title: 'Organizando Dívidas sem Culpa',
    summary: 'Estratégias práticas e humanas para negociar débitos sem ansiedade e retomar o fôlego financeiro.',
    cards: [
      {
        orderIndex: 1,
        title: 'Dívida Não Define Seu Valor',
        content: 'Ter dívidas não faz de você uma pessoa irresponsável. Imprevistos acontecem, o desemprego atinge muitas famílias e as taxas de juros no Brasil são altíssimas.',
      },
      {
        orderIndex: 2,
        title: 'O Primeiro Passo: Liste Tudo',
        content: 'Coloque no papel para quem você deve, o valor total e a taxa de juros. Dívidas com juros maiores (como cheque especial e rotativo do cartão) devem ser priorizadas ou negociadas.',
      },
      {
        orderIndex: 3,
        title: 'Reflexão Pessoal',
        content: 'Como você se sente quando precisa olhar para as suas dívidas? Saber exatamente o tamanho do desafio diminui a ansiedade.',
      },
    ],
    questions: [
      {
        orderIndex: 1,
        prompt: 'Qual deve ser a prioridade máxima ao organizar o pagamento de dívidas?',
        options: [
          { id: 'opt_1', text: 'Priorizar e renegociar as dívidas com maiores taxas de juros (rotativo e cheque especial)' },
          { id: 'opt_2', text: 'Pegar outro empréstimo mais caro para pagar o anterior' },
          { id: 'opt_3', text: 'Ignorar as cartas e ligações sem listar o que deve' },
        ],
        correctOptionId: 'opt_1',
      },
      {
        orderIndex: 2,
        prompt: 'Por que o rotativo do cartão de crédito é perigoso?',
        options: [
          { id: 'opt_1', text: 'Porque possui juros compostos altíssimos que multiplicam o valor da dívida rapidamente' },
          { id: 'opt_2', text: 'Porque o cartão para de funcionar em compras internacionais' },
          { id: 'opt_3', text: 'Porque você não ganha milhas aéreas' },
        ],
        correctOptionId: 'opt_1',
      },
      {
        orderIndex: 3,
        prompt: 'Qual é uma atitude recomendada na hora de renegociar uma dívida?',
        options: [
          { id: 'opt_1', text: 'Só aceitar parcelas que realmente caibam no seu orçamento mensal' },
          { id: 'opt_2', text: 'Prometer um valor que você sabe que não conseguirá pagar' },
          { id: 'opt_3', text: 'Pedir dinheiro emprestado a agiotas' },
        ],
        correctOptionId: 'opt_1',
      },
      {
        orderIndex: 4,
        prompt: 'O que significa ter uma postura compassiva com suas finanças?',
        options: [
          { id: 'opt_1', text: 'Reconhecer dificuldades passadas sem culpa e focar nas soluções possíveis de hoje' },
          { id: 'opt_2', text: 'Achar que você nunca vai aprender a lidar com dinheiro' },
          { id: 'opt_3', text: 'Comprar presentes caros para compensar o estresse' },
        ],
        correctOptionId: 'opt_1',
      },
    ],
  },
  {
    orderIndex: 5,
    title: 'Primeiros Passos da Reserva de Emergência',
    summary: 'Construa um colchão de segurança para imprevistos e durma com a mente tranquila.',
    cards: [
      {
        orderIndex: 1,
        title: 'O que é a Reserva de Emergência?',
        content: 'É um valor guardado em um local seguro e de resgate imediato (como Tesouro Selic ou CDB com liquidez diária) reservado exclusivamente para emergências médicas, perda de renda ou consertos urgentes.',
      },
      {
        orderIndex: 2,
        title: 'Comece com o que Puder',
        content: 'Não precisa começar com milhares de reais. Comece guardando R$ 20, R$ 50 ou R$ 100 por mês. O hábito da consistência é muito mais importante do que a quantia inicial.',
      },
      {
        orderIndex: 3,
        title: 'Reflexão Pessoal',
        content: 'Se um imprevisto de R$ 500 acontecesse hoje, você teria de onde tirar sem precisar recorrer ao cartão de crédito?',
      },
    ],
    questions: [
      {
        orderIndex: 1,
        prompt: 'Qual é o propósito fundamental de uma reserva de emergência?',
        options: [
          { id: 'opt_1', text: 'Cobrir imprevistos urgentes e necessários sem entrar em novas dívidas' },
          { id: 'opt_2', text: 'Comprar roupas novas na promoção de Black Friday' },
          { id: 'opt_3', text: 'Investir em ações arriscadas de empresas que podem falir' },
        ],
        correctOptionId: 'opt_1',
      },
      {
        orderIndex: 2,
        prompt: 'Onde deve ficar guardada a sua reserva de emergência?',
        options: [
          { id: 'opt_1', text: 'Em aplicações seguras, conservadoras e com liquidez diária (resgate imediato)' },
          { id: 'opt_2', text: 'Em criptomoedas voláteis' },
          { id: 'opt_3', text: 'Em imóveis na planta que demoram anos para vender' },
        ],
        correctOptionId: 'opt_1',
      },
      {
        orderIndex: 3,
        prompt: 'Qual a quantia recomendada para começar a montar sua reserva?',
        options: [
          { id: 'opt_1', text: 'Qualquer valor que caiba no seu bolso hoje, construindo o hábito aos poucos' },
          { id: 'opt_2', text: 'Apenas quem tem mais de R$ 10.000 pode começar' },
          { id: 'opt_3', text: 'Vender seus bens essenciais de uma vez' },
        ],
        correctOptionId: 'opt_1',
      },
      {
        orderIndex: 4,
        prompt: 'Qual o tamanho ideal da reserva de emergência para um trabalhador assalariado?',
        options: [
          { id: 'opt_1', text: 'Geralmente entre 3 a 6 meses do seu custo de vida essencial' },
          { id: 'opt_2', text: 'Exatamente 1 dia de salário' },
          { id: 'opt_3', text: '20 anos de rendimentos totais' },
        ],
        correctOptionId: 'opt_1',
      },
    ],
  },
];

export async function main() {
  console.log('--- SEED CATFINANCE ---');
  console.log('1. Seeding 14 standard system categories...');

  for (const cat of STANDARD_CATEGORIES) {
    const normalizedName = cat.name.trim().toLowerCase();

    const existing = await prisma.category.findFirst({
      where: {
        userId: null,
        type: cat.type,
        normalizedName,
      },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          userId: null,
          name: cat.name.trim(),
          normalizedName,
          type: cat.type,
          isSystem: true,
          isEssential: cat.isEssential,
        },
      });
      console.log(` Created standard category: [${cat.type}] ${cat.name}`);
    } else {
      console.log(` Existing standard category: [${cat.type}] ${cat.name}`);
    }
  }

  console.log('2. Seeding 5 educational lessons, cards and quizzes...');

  for (const lessonData of EDUCATIONAL_LESSONS) {
    // Check if lesson with this orderIndex exists
    let lesson = await prisma.lesson.findFirst({
      where: { orderIndex: lessonData.orderIndex },
    });

    if (!lesson) {
      lesson = await prisma.lesson.create({
        data: {
          orderIndex: lessonData.orderIndex,
          title: lessonData.title,
          summary: lessonData.summary,
        },
      });
      console.log(` Created lesson #${lesson.orderIndex}: ${lesson.title}`);
    } else {
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: {
          title: lessonData.title,
          summary: lessonData.summary,
        },
      });
      console.log(` Updated lesson #${lesson.orderIndex}: ${lesson.title}`);
    }

    // Sync Cards
    await prisma.lessonCard.deleteMany({ where: { lessonId: lesson.id } });
    for (const card of lessonData.cards) {
      await prisma.lessonCard.create({
        data: {
          lessonId: lesson.id,
          orderIndex: card.orderIndex,
          title: card.title,
          content: card.content,
        },
      });
    }

    // Sync Questions
    await prisma.quizQuestion.deleteMany({ where: { lessonId: lesson.id } });
    for (const q of lessonData.questions) {
      await prisma.quizQuestion.create({
        data: {
          lessonId: lesson.id,
          orderIndex: q.orderIndex,
          prompt: q.prompt,
          options: q.options,
          correctOptionId: q.correctOptionId,
        },
      });
    }
  }

  console.log('Seed completed successfully with 14 categories and 5 educational lessons!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
