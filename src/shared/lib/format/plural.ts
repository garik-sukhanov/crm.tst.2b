const rules = new Intl.PluralRules('ru-RU');

/** plural(5, ['задача', 'задачи', 'задач']) → «задач» */
export const plural = (count: number, [one, few, many]: [string, string, string]): string => {
  switch (rules.select(count)) {
    case 'one':
      return one;
    case 'few':
      return few;
    default:
      return many;
  }
};

export const pluralCount = (count: number, forms: [string, string, string]): string =>
  `${count} ${plural(count, forms)}`;
