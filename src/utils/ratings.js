function getRatings(ratings) {
  let oneStar = 0,
    twoStar = 0,
    threeStar = 0,
    fourStar = 0,
    fiveStar = 0,
    reviewer = 0;

  ratings.forEach((val) => {
    switch (val.rating) {
      case 1:
        oneStar += val.count;
        reviewer += val.count;
        break;
      case 2:
        twoStar += val.count;
        reviewer += val.count;
        break;
      case 3:
        threeStar += val.count;
        reviewer += val.count;
        break;
      case 4:
        fourStar += val.count;
        reviewer += val.count;
        break;
      case 5:
        fiveStar += val.count;
        reviewer += val.count;
        break;
      default:
        break;
    }
  });

  const ratingPercentage =
    (1 * oneStar + 2 * twoStar + 3 * threeStar + 4 * fourStar + 5 * fiveStar) / reviewer;

  const star = Math.round((ratingPercentage + Number.EPSILON) * 100) / 100;

  return {
    star: star ? star : 0,
    reviewer,
  };
}

module.exports = { getRatings };
