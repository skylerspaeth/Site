export const contributions = {
  users: [ "skylerspaeth", "sspaeth-r7" ]
};

export const map = {
  // OpenFreeMap's dark vector style: free, no API key. Changing this one value moves tile hosts.
  styleUrl: "https://tiles.openfreemap.org/styles/dark",
  // [[west, south], [east, north]]: the box the map is confined to and starts zoomed out on.
  // - Longitude: exactly one world wide (just under, see below), so nothing repeats. The seam is the
  //   Bering Strait (169W): mainland Alaska is on the left, and Russia (Chukotka, Wrangel), Fiji, Samoa and
  //   Tonga are whole on the right, which runs past 180 (190.998 is 169W on the next world copy).
  //   A full 360 breaks MapLibre's bounds math, hence the 0.002 shaved off.
  // - Latitude: the south edge (-58) is above Antarctica's coast (about -63), so none of it shows: it has no countries
  //   and would only make the rest of the map smaller.
  // Keep the card's aspect ratio in TravelMap.astro close to this box's shape (3:2: -58 and 84 make the box that shape).
  bounds: [[-169, -58], [190.998, 84]]
};
