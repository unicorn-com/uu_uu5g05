//@@viewOn:imports
import { createComponent, Utils, PropTypes } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
//@@viewOff:imports

//@@viewOn:helpers
class LoremIpsumUtil {
  // prettier-ignore
  static WORDS = [
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "quisque", "faucibus", "ex",
    "sapien", "vitae", "pellentesque", "sem", "placerat", "in", "id", "cursus", "mi", "pretium", "tellus", "duis",
    "convallis", "tempus", "leo", "eu", "aenean", "sed", "diam", "urna", "tempor", "pulvinar", "vivamus",
    "fringilla", "lacus", "nec", "metus", "bibendum", "egestas", "iaculis", "massa", "nisl", "malesuada",
    "lacinia", "integer", "nunc", "posuere", "ut", "hendrerit", "semper", "vel", "class", "aptent", "taciti",
    "sociosqu", "ad", "litora", "torquent", "per", "conubia", "nostra", "inceptos", "himenaeos", "orci", "varius",
    "natoque", "penatibus", "et", "magnis", "dis", "parturient", "montes", "nascetur", "ridiculus", "mus",
    "donec", "rhoncus", "eros", "lobortis", "nulla", "molestie", "mattis", "scelerisque", "maximus", "eget",
    "fermentum", "odio", "phasellus", "non", "purus", "est", "efficitur", "laoreet", "mauris", "pharetra",
    "vestibulum", "fusce", "dictum", "risus", "blandit", "quis", "suspendisse", "aliquet", "nisi", "sodales",
    "consequat", "magna", "ante", "condimentum", "neque", "at", "luctus", "nibh", "finibus", "facilisis",
    "dapibus", "etiam", "interdum", "tortor", "ligula", "congue", "sollicitudin", "erat", "viverra", "ac",
    "tincidunt", "nam", "porta", "elementum", "a", "enim", "euismod", "quam", "justo", "lectus", "commodo",
    "augue", "arcu", "dignissim", "velit", "aliquam", "imperdiet", "mollis", "nullam", "volutpat", "porttitor",
    "ullamcorper", "rutrum", "gravida", "cras", "eleifend", "turpis", "fames", "primis", "vulputate", "ornare",
    "sagittis", "vehicula", "praesent", "dui", "felis", "venenatis", "ultrices", "proin", "libero", "feugiat",
    "tristique", "accumsan", "maecenas", "potenti", "ultricies", "habitant", "morbi", "senectus", "netus",
    "suscipit", "auctor", "curabitur", "facilisi", "cubilia", "curae", "hac", "habitasse", "platea", "dictumst"
  ];

  static createParagraph({ random, ...attrs }) {
    // Standard deviation percentage for words and sentences
    const stDevPercentage = 0.5;

    // Get a random word from Latin word list
    const getRandomWord = () => this.WORDS[Utils.Number.random(this.WORDS.length - 1)];

    // Get a specific word from Latin word list
    const getWord = (i) => this.WORDS[i % this.WORDS.length];

    // Get a punctuation for middle of the sentence randomly
    const midPunctuation = (sentenceLength) => {
      const punctuations = [",", ";"];
      let punctuation;
      let position;
      if (sentenceLength > 6) {
        // 25% probability for punctuation
        const hasPunctuation = Math.random() <= 0.25;
        if (hasPunctuation) {
          position = Utils.Number.random(sentenceLength - 3, 2);
          punctuation = punctuations[Utils.Number.random(punctuations.length - 1)];
        }
      }
      return { punctuation, position };
    };

    // Get a punctuation for end of the sentence randomly
    const endPunctuation = () => {
      const random = Math.random();
      // 1% probability exclamation mark, 4% probability question mark, 95% probability dot
      if (random > 0.99) return "!";
      if (random > 0.95) return "?";
      return ".";
    };

    // Create a Sentence by using random words
    const createSentence = ({ withLoremIpsum, avgWords = 8 }) => {
      if (withLoremIpsum) return "Lorem ipsum odor amet, consectetuer adipiscing elit.";
      const stDev = Math.ceil(avgWords * stDevPercentage);
      const sentenceLength = Math.max(1, Utils.Number.random(avgWords + stDev, avgWords - stDev));
      const midPunc = midPunctuation(sentenceLength);

      let sentence = "";
      for (let i = 0; i < sentenceLength; i += 1) {
        sentence += `${getRandomWord()}${midPunc.position === i ? midPunc.punctuation : ""} `;
      }
      sentence = `${sentence.charAt(0).toUpperCase() + sentence.substr(1).trim()}${endPunctuation()}`;
      return sentence;
    };

    // Creates always the same text, averages are used as exacts.
    const createStandardParagraph = ({ avgWords = 8, avgSentences = 8 }) => {
      let paragraph = [];

      for (let i = 0; i < avgSentences; i += 1) {
        let sentence = "";
        for (let j = 0; j < avgWords; j += 1) {
          sentence += `${getWord(i * avgSentences + j)} `;
        }
        paragraph.push(sentence.charAt(0).toUpperCase() + sentence.slice(1).trim() + ".");
      }
      return paragraph.join(" ");
    };

    // Create a paragraph by joining sentences
    const createRandomParagraph = ({ firstParagraph, avgWords, avgSentences, startLoremIpsum }) => {
      const stDev = Math.ceil(avgSentences * stDevPercentage);
      const paragraphLength = Math.max(1, Utils.Number.random(avgSentences - stDev, avgSentences + stDev));

      let paragraph = [];
      for (let i = 0; i < paragraphLength; i += 1) {
        paragraph.push(
          createSentence({
            withLoremIpsum: i === 0 && firstParagraph && startLoremIpsum,
            avgWords,
          }),
        );
      }
      return paragraph.join(" ");
    };

    return random ? createRandomParagraph(attrs) : createStandardParagraph(attrs);
  }
}

function Paragraph({ random, firstParagraph, avgWords, avgSentences, startLoremIpsum, ...restProps }) {
  const { elementAttrs, componentProps } = Utils.VisualComponent.splitProps(restProps);
  return (
    <Uu5Elements.Text {...componentProps} colorScheme="building">
      {({ style }) => (
        <p
          {...elementAttrs}
          className={Utils.Css.joinClassName(
            elementAttrs.className,
            Config.Css.css({ ...style, margin: 0, "& + &": { margin: "16px 0" } }),
          )}
        >
          {LoremIpsumUtil.createParagraph({
            random,
            firstParagraph,
            avgWords,
            avgSentences,
            startLoremIpsum,
          })}
        </p>
      )}
    </Uu5Elements.Text>
  );
}

//@@viewOff:helpers

const LoremIpsum = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "LoremIpsum",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    paragraphCount: PropTypes.number,
    random: PropTypes.bool,
    avgWords: PropTypes.number,
    avgSentences: PropTypes.number,
    startLoremIpsum: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    paragraphCount: 1,
    random: false,
    avgWords: 8,
    avgSentences: 10,
    startLoremIpsum: true,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { paragraphCount, random, avgWords, avgSentences, startLoremIpsum, ...restProps } = props;
    const parProps = { paragraphCount, random, avgWords, avgSentences, startLoremIpsum };
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    let result;

    if (paragraphCount > 1) {
      const attrs = Utils.VisualComponent.getAttrs(restProps);

      result = (
        <div {...attrs}>
          {Array.from({ length: paragraphCount }, (_, i) => (
            <Paragraph key={i} {...parProps} />
          ))}
        </div>
      );
    } else {
      result = <Paragraph {...props} />;
    }

    return result;
    //@@viewOff:render
  },
});

LoremIpsum.editMode = {
  customEdit: false,
};

export { LoremIpsum };
export default LoremIpsum;
