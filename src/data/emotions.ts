/**
 * The Geoffrey Roberts feelings wheel: 7 core emotions, 41 secondary, 82
 * tertiary — 130 words.
 *
 * IDs are path-based ("sad.lonely.isolated") rather than label-based, because
 * labels are NOT unique on this wheel. "Embarrassed" appears under both
 * Disgusted and Sad; "Disappointed" under both; "Overwhelmed" under Fearful and
 * Bad; "Inferior" under Fearful and Sad. Keying by label would silently merge
 * genuinely different feelings and corrupt the saved history. Once an id is
 * published it must never change or be reused — saved entries point at it.
 */

export type Ring = "core" | "secondary" | "tertiary";

export interface EmotionNode {
  id: string;
  label: string;
  /** One plain line, written to distinguish this word from its neighbours. */
  gloss: string;
  ring: Ring;
  coreId: string;
  parentId?: string;
}

interface TertiarySpec {
  label: string;
  gloss: string;
}
interface SecondarySpec {
  label: string;
  gloss: string;
  tertiary: TertiarySpec[];
}
interface CoreSpec {
  label: string;
  gloss: string;
  secondary: SecondarySpec[];
}

const slug = (label: string) => label.toLowerCase().replace(/\s+/g, "-");

/** Clockwise from the top, in the arrangement the printed wheel uses. */
const WHEEL: CoreSpec[] = [
  {
    label: "Happy",
    gloss: "Things feel good, and you are glad to be where you are.",
    secondary: [
      {
        label: "Playful",
        gloss: "Light and mischievous — up for fun with no particular purpose.",
        tertiary: [
          { label: "Aroused", gloss: "Awake and stimulated; your senses are switched on." },
          { label: "Cheeky", gloss: "Playfully bold — teasing, a little naughty, enjoying it." },
        ],
      },
      {
        label: "Content",
        gloss: "Enough. Nothing is missing right now.",
        tertiary: [
          { label: "Free", gloss: "Unrestricted — nothing is holding you back or hemming you in." },
          { label: "Joyful", gloss: "A bright, lifting gladness that is hard to keep quiet." },
        ],
      },
      {
        label: "Interested",
        gloss: "Leaning in — something has your attention.",
        tertiary: [
          { label: "Curious", gloss: "Drawn to find out more, for the pleasure of knowing." },
          { label: "Inquisitive", gloss: "Actively asking and digging, not just idly wondering." },
        ],
      },
      {
        label: "Proud",
        gloss: "Warmed by something you did, or something you are.",
        tertiary: [
          { label: "Successful", gloss: "You set out to do something and you did it." },
          { label: "Confident", gloss: "Sure you can handle what is in front of you." },
        ],
      },
      {
        label: "Accepted",
        gloss: "You belong here as you are, without editing yourself.",
        tertiary: [
          { label: "Respected", gloss: "Taken seriously; your judgement carries weight with people." },
          { label: "Valued", gloss: "Wanted for who you are, not for what you provide." },
        ],
      },
      {
        label: "Powerful",
        gloss: "Capable and effective — you can make things happen.",
        tertiary: [
          { label: "Courageous", gloss: "Willing to act even though it frightens you." },
          { label: "Creative", gloss: "Ideas are arriving and you want to make something." },
        ],
      },
      {
        label: "Peaceful",
        gloss: "Settled and unhurried; nothing is pulling at you.",
        tertiary: [
          { label: "Loving", gloss: "Warm and open toward someone, wanting good for them." },
          { label: "Thankful", gloss: "Aware of something good you were given rather than owed." },
        ],
      },
      {
        label: "Trusting",
        gloss: "Willing to be open, believing you will be handled with care.",
        tertiary: [
          { label: "Sensitive", gloss: "Finely tuned to feeling — your own and other people's." },
          { label: "Intimate", gloss: "Close enough to be truly known, and letting that happen." },
        ],
      },
      {
        label: "Optimistic",
        gloss: "Expecting things to go well.",
        tertiary: [
          { label: "Hopeful", gloss: "Believing something better is possible, even now." },
          { label: "Inspired", gloss: "Lit up by something and wanting to act on it." },
        ],
      },
    ],
  },
  {
    label: "Surprised",
    gloss: "Something landed that you did not see coming.",
    secondary: [
      {
        label: "Startled",
        gloss: "Caught off guard — a jolt, before you have made sense of it.",
        tertiary: [
          { label: "Shocked", gloss: "So unexpected it stops you; the ground moved." },
          { label: "Dismayed", gloss: "The surprise was bad news, and it is sinking in." },
        ],
      },
      {
        label: "Confused",
        gloss: "The pieces do not add up and you cannot place why.",
        tertiary: [
          { label: "Disillusioned", gloss: "Something you believed in turned out not to be true." },
          { label: "Perplexed", gloss: "Genuinely puzzled — turning it over and still not seeing it." },
        ],
      },
      {
        label: "Amazed",
        gloss: "Struck by something remarkable.",
        tertiary: [
          { label: "Astonished", gloss: "So far beyond expectation you can hardly credit it." },
          { label: "Awe", gloss: "Made small, in a good way, by something vast." },
        ],
      },
      {
        label: "Excited",
        gloss: "Charged up and looking forward to what is coming.",
        tertiary: [
          { label: "Eager", gloss: "Impatient to begin — ready before it starts." },
          { label: "Energetic", gloss: "Full of go, with more in you than you need." },
        ],
      },
    ],
  },
  {
    label: "Bad",
    gloss: "Not quite an emotion — just off, depleted, not right.",
    secondary: [
      {
        label: "Bored",
        gloss: "Nothing is holding you; time is dragging.",
        tertiary: [
          { label: "Indifferent", gloss: "You could take it or leave it; the thing does not move you." },
          { label: "Apathetic", gloss: "You cannot summon the will to care, even about what matters to you." },
        ],
      },
      {
        label: "Busy",
        gloss: "Too much to do and no room left in the day.",
        tertiary: [
          { label: "Pressured", gloss: "Pushed by expectations — someone else's clock is running." },
          { label: "Rushed", gloss: "Moving faster than you would like and doing nothing properly." },
        ],
      },
      {
        label: "Stressed",
        gloss: "Under more load than you have capacity for.",
        tertiary: [
          { label: "Overwhelmed", gloss: "The amount coming at you is past what you can process." },
          { label: "Out of control", gloss: "Things are happening to you and you cannot steer them." },
        ],
      },
      {
        label: "Tired",
        gloss: "Running low; what you need is rest, not effort.",
        tertiary: [
          { label: "Sleepy", gloss: "Physically heavy — your body is asking for sleep." },
          { label: "Unfocused", gloss: "Awake but scattered; nothing will stay in your head." },
        ],
      },
    ],
  },
  {
    label: "Fearful",
    gloss: "Something threatens you, and part of you is bracing.",
    secondary: [
      {
        label: "Scared",
        gloss: "Immediate fear — there is a threat and your body knows it.",
        tertiary: [
          { label: "Helpless", gloss: "Something bad is coming and there is nothing you can do." },
          { label: "Frightened", gloss: "Sharp, present fear — you want to get away." },
        ],
      },
      {
        label: "Anxious",
        gloss: "Dread without a clear object; the alarm will not switch off.",
        tertiary: [
          { label: "Overwhelmed", gloss: "More is coming at you than you can hold, and it will not stop." },
          { label: "Worried", gloss: "Your mind keeps circling a bad outcome that has not happened." },
        ],
      },
      {
        label: "Insecure",
        gloss: "Unsure you are enough, and watching for signs that you are not.",
        tertiary: [
          { label: "Inadequate", gloss: "You do not have what this needs — you are not up to it." },
          { label: "Inferior", gloss: "Measuring yourself against someone else and coming up short." },
        ],
      },
      {
        label: "Weak",
        gloss: "Without the strength or standing to protect yourself.",
        tertiary: [
          { label: "Worthless", gloss: "A sense that you have no value at all, to anyone." },
          { label: "Insignificant", gloss: "Small and unnoticed; it would not matter if you were not here." },
        ],
      },
      {
        label: "Rejected",
        gloss: "Pushed away by someone whose acceptance you wanted.",
        tertiary: [
          { label: "Excluded", gloss: "Left out of something that others were included in." },
          { label: "Persecuted", gloss: "Singled out and treated unfairly, again and again." },
        ],
      },
      {
        label: "Threatened",
        gloss: "Something is coming for what is yours — safety, standing, or a person.",
        tertiary: [
          { label: "Nervous", gloss: "Keyed up before something; your body is ahead of the event." },
          { label: "Exposed", gloss: "Uncovered and unprotected, where anyone could reach you." },
        ],
      },
    ],
  },
  {
    label: "Angry",
    gloss: "Something is wrong, and it should not be.",
    secondary: [
      {
        label: "Let down",
        gloss: "Someone you were counting on did not come through.",
        tertiary: [
          { label: "Betrayed", gloss: "Trust you had given was used against you." },
          { label: "Resentful", gloss: "An old unfairness you never got to put down." },
        ],
      },
      {
        label: "Humiliated",
        gloss: "Made small in front of other people.",
        tertiary: [
          { label: "Disrespected", gloss: "Treated as though you do not matter or do not count." },
          { label: "Ridiculed", gloss: "Made the joke — laughed at, not laughed with." },
        ],
      },
      {
        label: "Bitter",
        gloss: "Anger that has soaked in and gone sour over time.",
        tertiary: [
          { label: "Indignant", gloss: "Anger on principle — this is not right and someone should say so." },
          { label: "Violated", gloss: "A line that was yours was crossed without your consent." },
        ],
      },
      {
        label: "Mad",
        gloss: "Hot, plain anger.",
        tertiary: [
          { label: "Furious", gloss: "Anger at full volume, and hard to contain." },
          { label: "Jealous", gloss: "Afraid of losing something, or someone, to another person." },
        ],
      },
      {
        label: "Aggressive",
        gloss: "Anger pushing outward, wanting to confront.",
        tertiary: [
          { label: "Provoked", gloss: "Poked until you reacted — someone brought this out of you." },
          { label: "Hostile", gloss: "Set against them; part of you wants them to lose." },
        ],
      },
      {
        label: "Frustrated",
        gloss: "Blocked from something you are trying to do.",
        tertiary: [
          { label: "Infuriated", gloss: "Blocked so long that the frustration has turned to rage." },
          { label: "Annoyed", gloss: "A small, nagging irritation that keeps snagging on you." },
        ],
      },
      {
        label: "Distant",
        gloss: "Anger turned into withdrawal — you have stepped back from it.",
        tertiary: [
          { label: "Withdrawn", gloss: "Pulled back out of reach, on purpose." },
          { label: "Numb", gloss: "Feeling nothing, because feeling it was too much." },
        ],
      },
      {
        label: "Critical",
        gloss: "Looking for the fault, and finding it.",
        tertiary: [
          { label: "Skeptical", gloss: "Not buying it — you doubt what you are being told." },
          { label: "Dismissive", gloss: "Waving it away as not worth your consideration." },
        ],
      },
    ],
  },
  {
    label: "Disgusted",
    gloss: "Something is wrong in a way that makes you want it away from you.",
    secondary: [
      {
        label: "Disapproving",
        gloss: "You judge this as wrong and want no part in it.",
        tertiary: [
          { label: "Judgmental", gloss: "Measuring someone against your standard and finding them wanting." },
          { label: "Embarrassed", gloss: "Caught out — you would rather not have been seen." },
        ],
      },
      {
        label: "Disappointed",
        gloss: "It fell short of what you had expected of it.",
        tertiary: [
          { label: "Appalled", gloss: "Shocked at how bad, or how wrong, it turned out to be." },
          { label: "Revolted", gloss: "It repels you — you recoil from it." },
        ],
      },
      {
        label: "Awful",
        gloss: "A sick, heavy wrongness.",
        tertiary: [
          { label: "Nauseated", gloss: "It turns your stomach, physically." },
          { label: "Detestable", gloss: "Something you find genuinely hateful." },
        ],
      },
      {
        label: "Repelled",
        gloss: "Everything in you wants to back away from it.",
        tertiary: [
          { label: "Horrified", gloss: "Frozen by something dreadful." },
          { label: "Hesitant", gloss: "Holding back — something about this is not right." },
        ],
      },
    ],
  },
  {
    label: "Sad",
    gloss: "Something is lost or missing, and it weighs.",
    secondary: [
      {
        label: "Hurt",
        gloss: "Someone caused you pain, and it landed.",
        tertiary: [
          { label: "Embarrassed", gloss: "Exposed in a way that stung." },
          { label: "Disappointed", gloss: "Someone did not turn out to be who you hoped they were." },
        ],
      },
      {
        label: "Depressed",
        gloss: "Flattened — the colour has gone out of things.",
        tertiary: [
          { label: "Inferior", gloss: "A settled sense of being less than the people around you." },
          { label: "Empty", gloss: "Hollowed out; there is nothing in there to feel." },
        ],
      },
      {
        label: "Lonely",
        gloss: "You want connection and it is not there.",
        tertiary: [
          { label: "Isolated", gloss: "Cut off — no one is within reach." },
          { label: "Abandoned", gloss: "Someone who should have stayed left." },
        ],
      },
      {
        label: "Guilty",
        gloss: "You did something you believe was wrong.",
        tertiary: [
          { label: "Ashamed", gloss: "Not that you did wrong, but that you are wrong." },
          { label: "Remorseful", gloss: "Sorry for the harm, and wishing you could undo it." },
        ],
      },
      {
        label: "Despair",
        gloss: "Hope has gone; you cannot see this changing.",
        tertiary: [
          { label: "Powerless", gloss: "Nothing you do will alter this." },
          { label: "Grief", gloss: "The particular sadness of having lost someone or something." },
        ],
      },
      {
        label: "Vulnerable",
        gloss: "Open and unprotected, where you could be hurt.",
        tertiary: [
          { label: "Victimized", gloss: "Something was done to you that you did not deserve." },
          { label: "Fragile", gloss: "Close to breaking; asking to be handled gently." },
        ],
      },
    ],
  },
];

function build(): EmotionNode[] {
  const nodes: EmotionNode[] = [];
  for (const core of WHEEL) {
    const coreId = slug(core.label);
    nodes.push({
      id: coreId,
      label: core.label,
      gloss: core.gloss,
      ring: "core",
      coreId,
    });
    for (const second of core.secondary) {
      const secondId = `${coreId}.${slug(second.label)}`;
      nodes.push({
        id: secondId,
        label: second.label,
        gloss: second.gloss,
        ring: "secondary",
        coreId,
        parentId: coreId,
      });
      for (const third of second.tertiary) {
        nodes.push({
          id: `${secondId}.${slug(third.label)}`,
          label: third.label,
          gloss: third.gloss,
          ring: "tertiary",
          coreId,
          parentId: secondId,
        });
      }
    }
  }
  return nodes;
}

/** Every node on the wheel, flat, in clockwise wheel order. */
export const EMOTIONS: EmotionNode[] = build();

export const EMOTION_BY_ID: ReadonlyMap<string, EmotionNode> = new Map(
  EMOTIONS.map((node) => [node.id, node]),
);

export const CORES: EmotionNode[] = EMOTIONS.filter((n) => n.ring === "core");

export const CORE_IDS: string[] = CORES.map((c) => c.id);
