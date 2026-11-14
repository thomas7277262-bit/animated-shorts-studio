# "Patch, the Dog Nobody Picked" – Character Reference v1

All characters are original designs, built from the specs in `src/story/characters.js` (`PATCH_CAST`). That one spec is used for every shot, which keeps each character identical throughout the video.
Style: blocky game-avatar proportions, rounded-cube heads, simple expressive faces (eyes, brows, mouth, blush, tears), chunky limbs. Reference images are rendered with the real engine (`node productions/patch/render_sheets.mjs`).

| Character | Build | Head / face | Hair | Outfit & colours | Signature details |
|---|---|---|---|---|---|
| **Patch** (hero dog) | Small blocky dog, **three legs** (missing front-left, small stump) | Cream face, **brown patch around his right eye**, black nose, opening jaw | – | Cream fur `#f2e6cf` with rounded brown patches `#8a5a34`, cream muzzle and paws | **One floppy brown ear** (right), one pointed ear (left), **worn red collar** with a brass tag; three-legged hopping walk and run |
| **Duchess** (designer puppy) | Tiny (62% of Patch), poodle-style puffs | White face, eyelashes | Fluffy white puffs on the head | Pure white fur | **Pink bow**, pink collar, gold tag, soft round fluff on back and tail |
| **Owen** (hero kid, ~10) | Short (0.86 scale) | Light skin, **freckles**, round eyes | **Messy red-orange** tufts | **Oversized green hoodie** with white drawstrings and a kangaroo pocket, hood behind the neck, blue jeans | **Red sneakers**; carries the new red collar in the finale |
| **Ms. Reyes** (shelter worker) | Average height | Warm brown skin, rosy cheeks, kind eyes | Dark brown **curly bun** | **Teal polo with a white paw-print logo**, slate trousers, white sneakers | **Orange lanyard with ID card** |
| **Mrs. Vivian Vandermeer** (rich mom) | Tall (1.05) | Fair skin, eyelashes; **sunglasses can come off per shot** | **Blonde beehive** | All-white blouse with a gold trim band, white trousers, gold shoes | **Pearl necklace**, **gold handbag**, black sunglasses |
| **Mr. Preston Vandermeer** (rich dad) | Tallest (1.1) | Fair skin, thick brows, sunglasses | **Slicked-back black hair** | White three-piece-look suit with a gold tie | **Gold watch**, brown shoes |
| **Sloane Vandermeer** (rich kid, no lines) | Small (0.8) | Fair skin, eyelashes, blush, sunglasses | **Blonde pigtails with pink bows** | White dress with a pink dotted hem, pink shoes | Matches her parents' all-white look |

**Expression sets prepared:** Owen (neutral, sad, crying, happy, surprised, laughing) · Ms. Reyes (neutral, happy, sad, surprised, love, laughing) · Mrs. Vandermeer (smug in sunglasses, smug, laughing, shocked, sad, crying) · Patch (neutral, happy, sad, crying, determined, love) · Duchess (neutral, happy, scared, crying, surprised, love).

**Dog animation set:** idle, wag, three-legged walk, three-legged run, head tilt, sit, lie down, sad lie, bark, pull or tug, shiver, jump, lick.
**Extras (to be built in the render phase):** adopting families, shelter dogs, neighbours, park kids. These will be generic variants, deliberately plainer than the main cast.
