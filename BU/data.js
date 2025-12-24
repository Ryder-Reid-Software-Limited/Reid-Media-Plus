// Sample data
window.CATALOG = [
  {
  id: "wba",
  type: "series",
  title: "Willy's Big Adventure",
  year: 2025,
  auRating: "MA15+",
  trailerSrc: "https://reidmediaplus-wba1.reidmedia.org/trailer.mp4",
  poster: "/images/cover.png",
  advice: ["Coarse Language", "Strong Violence", "Sexual References", "Drug References", "Mature Themes"],
  seasons: [
    {
      season: 1,
      episodes: [
        {
          ep: 0,
          title: "Trailer",
          durationMin: 1,
          advice: ["Approved for all audiences"],
          poster: "/images/coverwba.png",     // <—
          src: "https://reidmediaplus-wba3.reidmedia.org/Trailer.mp4"
        },
        {
          ep: 1,
          title: "Welcome to the Goldcoast",
          durationMin: 15,
          poster: "/images/WBA-EP1.png",     // <— episode-specific cover
          src: "https://reidmediaplus-wba1.reidmedia.org/Episode%201.mp4"
        },
        {
          ep: 2,
          title: "Wet Times with the Joker",
          durationMin: 36,
          poster: "/images/WBA-EP2.png",     // <—
          src: "https://reidmediaplus-wba1.reidmedia.org/Episode%202.mp4"
        },
        {
          ep: 3,
          title: "5 Slides in 2 Hours",
          durationMin: 22,
          poster: "/images/WBA-EP3.png",     // <—
          src: "https://reidmediaplus-wba2.reidmedia.org/Episode%203.mp4"
        },
        {
          ep: 4,
          title: "119 Metres High",
          durationMin: 25,
          poster: "/images/WBA-EP4.png",     // <—
          src: "https://reidmediaplus-wba2.reidmedia.org/Episode%204.mp4"
        },
        {
          ep: 5,
          title: "The Final Camp",
          durationMin: 25,
          poster: "/images/WBA-EP5.png",     // <—
          src: "https://reidmediaplus-wba3.reidmedia.org/Episode%205.mp4"
        },
      ],
    }
  ]
},
  {
    id: "wbs2024",
    type: "movie",
    title: "Willy's Kitchen Birthday Special 2024",
    year: 2024,
    durationMin: 60,
    poster: "/images/wkbs.png",
    src: "https://playable-content2.reidmedia.org/Willys%20Kitchen%20Birthday%20Special.mp4",
    trailerSrc: "https://playable-content.reidmedia.org/Willy's%20Kitchen%20BIrthday%20Special%20Trailer2.mp4",
    auRating: "MA15+",
    advice: ["Coarse Language", "Strong Violence", "Sexual References", "Mature Themes"],
  },
  {
  id: "wk",
  type: "series",
  title: "Willy's Kitchen",
  year: 2024,
  trailerSrc: "https://playable-content.reidmedia.org/Willy's%20Kitchen%20Trailer.mp4",
  auRating: "MA15+",
  poster: "/images/episode 2.png",
  advice: ["Coarse Language", "Strong Violence", "Drug References", "Mature Themes"],
  seasons: [
    {
      season: 1,
      episodes: [
        {
          ep: 1,
          title: "Pizza",
          durationMin: 12,
          poster: "images/willyskitchen.png",     // <— episode-specific cover
          src: "https://playable-content.reidmedia.org/wkep1.mp4"
        },
        {
          ep: 2,
          title: "Breakie",
          durationMin: 12,
          poster: "/images/episode 2.png",     // <—
          src: "https://playable-content.reidmedia.org/wkep2.mp4"
        },
        {
          ep: 3,
          title: "Trailer",
          durationMin: 1,
          poster: "/images/willyskitchentrailer.png",
          advice: ["Approved for all audiences"],     // <—
          src: "https://playable-content.reidmedia.org/Willy's%20Kitchen%20Trailer.mp4"
        },
      ]
    }
  ]
},
  {
    id: "mcu",
    type: "movie",
    title: "My Creepy Uncle",
    year: 2024,
    durationMin: 18,
    poster: "/images/mcu.png",
    trailerSrc: "https://playable-content.reidmedia.org/mcutrailer.mp4",
    src: "https://playable-content.reidmedia.org/mcu_fullmoviemp4.mp4",
    auRating: "MA15+",
    advice: ["Mature Themes", "Coarse Language", "Strong Violence", "Drug References", "Sexual References"]
  },
  {
    id: "ts",
    type: "movie",
    title: "The Shoe",
    year: 2024,
    durationMin: 1,
    poster: "/images/theshoe.png",
    src: "https://playable-content.reidmedia.org/TheShoebyRyder.mp4",
    auRating: "G",
    advice: ["General"]
  },
  {
    id: "davo",
    type: "movie",
    title: "Davo",
    year: 2024,
    durationMin: 1,
    poster: "/images/davo.png",
    src: "https://playable-content.reidmedia.org/Davo.mp4",
    auRating: "PG",
    advice: ["Parental Guidance"]
  },
  {
  id: "rb",
  type: "series",
  title: "Ryder's Backyard",
  year: 2025,
  trailerSrc: "https://playable-content.reidmedia.org/Willy's%20Kitchen%20Trailer.mp4",
  auRating: "M",
  poster: "/images/rydersbackyardicons/ep1.png",
  advice: ["Coarse Language", "Mature Themes"],
  seasons: [
    {
      season: 1,
      episodes: [
        {
          ep: 1,
          title: "Valentines Day",
          durationMin: 12,
          poster: "/images/rydersbackyardicons/ep1.png",     // <— episode-specific cover
          src: "https://playable-content4.reidmedia.org/RB1.mp4"
        },
      ]
    }
  ]
},
];
