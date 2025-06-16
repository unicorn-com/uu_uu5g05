//@@viewOn:imports
//@@viewOff:imports

const Tools = {
  getComponentNameFromUu5Tag(allName) {
    let header = allName;
    if (allName) {
      let nameParts = allName.split(".");
      header = nameParts[nameParts.length - 1];
    }
    return header;
  },
};

export { Tools };
export default Tools;
