import React from 'react';
import VisualDemo from './VisualDemo';

class AudioDataContainer extends React.Component {

  constructor(props) {
    super(props);
    this.state = {}
    this.frequencyBandArray = [...Array(12).keys()]
  }
  componentDidMount = () => {
    // this.initializeAudioAnalyser();
  }

  initializeAudioAnalyser = () => {
    const audioFile = this.props.audio;
    const audioContext = window.AudioContext ? new AudioContext() : new webkitAudioContext();
    const source = audioContext.createMediaElementSource(audioFile);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 64
    source.connect(audioContext.destination);
    source.connect(analyser);
    // audioFile.play()
      this.setState({
        audioData: analyser
      })
  }

  getFrequencyData = (styleAdjuster) => {
    const bufferLength = this.state.audioData.frequencyBinCount;
    const amplitudeArray = new Uint8Array(bufferLength);
    this.state.audioData.getByteFrequencyData(amplitudeArray)
    styleAdjuster(amplitudeArray)
  }

  render(){

    return (
      <div>
        <VisualDemo
          initializeAudioAnalyser={this.initializeAudioAnalyser}
          frequencyBandArray={this.frequencyBandArray}
          getFrequencyData={this.getFrequencyData}
          audioData={this.state.audioData}
          rainbow={this.props.rainbow}
           toggleRainbow={this.props.toggleRainbow} 
        />
      </div>
    );
  }
}

export default AudioDataContainer;