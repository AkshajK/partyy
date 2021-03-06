import React, { useRef , useState}  from 'react';
import Paper from '@material-ui/core/Paper';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import EqualizerIcon from '@material-ui/icons/Equalizer';
import { makeStyles } from '@material-ui/core/styles';
import '../stylesheets/App.scss';

const useStyles = makeStyles(theme => ({
  flexContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingTop: '25%'
  }
}));

export default function VisualDemo(props) {
    const [mounted, setMounted] = useState(false);
    const classes = useStyles();

    const amplitudeValues = useRef(null);

    function adjustFreqBandStyle(newAmplitudeData){
      amplitudeValues.current = newAmplitudeData;
      let domElements = props.frequencyBandArray.map((num) =>
        document.getElementById(num))
      for(let i=0; i<props.frequencyBandArray.length; i++){
        let num = props.frequencyBandArray[i]
        if(domElements[num]) {
         //console.log(amplitudeValues.current[num])
         
        if(props.rainbow) {
          let color= 'hsl('+(Math.floor((new Date().getTime())/50) % 360 - 50 + Math.floor(amplitudeValues.current[num]/4))+', 100%, 50%)'
          domElements[num].style.backgroundColor = color //`hsl(${2*amplitudeValues.current[num]-100}, 100%, 50%)`
        }
        else domElements[num].style.backgroundColor = `rgb(0, ${amplitudeValues.current[num]}, 255)`
        domElements[num].style.height = `${amplitudeValues.current[num]}px`
        domElements[num].style.width= `6%`
        }
      }
    };

    function runSpectrum(){
      props.getFrequencyData(adjustFreqBandStyle)
      requestAnimationFrame(runSpectrum)
    }

    function handleStartBottonClick(){
      props.initializeAudioAnalyser()
      requestAnimationFrame(runSpectrum)
    }
    
    if(!mounted) {
      handleStartBottonClick();
      setMounted(true);
    }

    return (
    
      <div>
        <div className={classes.flexContainer}>
          {props.frequencyBandArray.map((num) =>
            <Paper
              className={'frequencyBands'}
              elevation={4}
              id={num}
              key={num}
              onClick={()=>{props.toggleRainbow()}}
             
            />
          )}
        </div>

      </div>

    );

}