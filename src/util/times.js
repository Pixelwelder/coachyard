const padNum = (str, padTo = 2) => {
  const string = String(str);
  return string.length < padTo ? `${'0'.repeat(padTo - string.length)}${string}` : string;
};

const to12Hour = (time) => {
  let [hours, minutes] = time.split(':').map((str) => Number(str));
  const ending = hours < 13 ? 'AM' : 'PM';
  if (hours > 12) hours -= 12;
  return `${hours}:${padNum(minutes)} ${ending}`;
};

const times = [];
const listTimes = ({ increment = 15 } = {}) => {
  if (!times.length) {
    for (let i = 0; i < (24 * (60 / increment)); i++) {
      const all = i * increment;
      const hours = Math.floor(all / 60);
      const minutes = hours ? (all % (hours * 60)) : all;
      times.push(to12Hour(`${hours}:${minutes}`));
    }
  }

  return times;
};

export { padNum, to12Hour, listTimes };
