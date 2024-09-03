class NNMorph extends Morph {
  
}

class NNEditorMorph extends ScrollFrameMorph {
  constructor(sliderColor) {
    super(null, null, sliderColor)

    this.acceptsDrops = false;
    this.contents.acceptsDrops = false;
  }
}
