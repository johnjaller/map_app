import './App.css';
import 'ol/ol.css';

import GeoJSON from 'ol/format/GeoJSON';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import Overlay from 'ol/Overlay.js';
import Map from 'ol/Map.js';
import OSM from 'ol/source/OSM.js';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style, Text, Circle } from 'ol/style';
import View from 'ol/View.js';
import { useEffect, useRef, useState, useDeferredValue, useMemo, Fragment, useTransition } from 'react';
import { Card, Paper, List, ListItem, Typography, Accordion, AccordionSummary, AccordionDetails, Table, TableRow, TableCell, TableHead, TableBody, TextField } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { fromLonLat } from 'ol/proj';
import { Coordinate } from 'ol/coordinate';
import { easeOut } from 'ol/easing';
function App() {

  const mapRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const currentLocation = useRef<Coordinate | null>(null)
  const hoverLocation = useRef<number | null>(null)
  const [map, setMap] = useState<Map | null>(null);
  const [query, setQuery] = useState<string>('');
  const deferredQuery = useDeferredValue(query);
  const markerRef = useRef<Overlay | null>(null);
  const [layer, setLayer] = useState<VectorLayer<VectorSource> | null>(null);
  const [properties, setProperties] = useState<any>(null);
  const [list, setList] = useState<Array<any>>([]);
  const [selectItem, setSelectItem] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  useEffect(() => {
    let districtSOurce = new VectorSource({

      format: new GeoJSON(),
      url: '/election_district.json',

    })
    markerRef.current = new Overlay({
      id: 'info',
      autoPan: true,
      position: undefined,
      offset: [0, -10],
      positioning: 'bottom-center',
      element: popupRef.current ?? undefined,
    });
    let layer = new VectorLayer({

      opacity: 0.5,
      source: districtSOurce,
      style: (feature, res) => {
        return new Style({
          fill: new Fill({
            color: hoverLocation.current === feature.getProperties().OBJECTID ? 'red' : 'black',
          }),
          stroke: new Stroke({
            color: 'white',
          }),
          text: new Text({
            font: '15px sans-serif',
            justify: 'right',
            fill: new Fill({
              color: 'white'
            }),
            text: feature.getProperties().CNAME
          })


        })
      },
    })
    setLayer(layer)
    let mapObject = new Map({
      layers: [
        new TileLayer({
          source: new OSM(),

        }), layer,
        new VectorLayer({
          source: new VectorSource({
            format: new GeoJSON(),
            url: 'https://geodata.gov.hk/gs/api/v1.0.0/geoDataQuery?q=%7Bv%3A%221%2E0%2E0%22%2Cid%3Ab545518d-efe1-446d-8525-530b23047aba%2Clang%3A%22ALL%22%7D',

          }),
          updateWhileAnimating: true,
          style: new Style({
            image: new Circle({
              radius: 5,
              fill: new Fill({
                color: 'orange',
              }),
            }),
            zIndex: 10
          })




        })
      ],
      view: new View({
        center: [12703553.2198509, 2558197.61549422],
        zoom: 10,

      }),
      overlays: [markerRef.current]
    })
    setMap(mapObject)
    mapRef?.current && mapObject.setTarget(mapRef?.current);
    return () => mapObject.setTarget(undefined);


  }, [mapRef.current, popupRef.current])

  useEffect(() => {

    map?.on('click', (event) => {
      // event.map.
      let target = map.getFeaturesAtPixel(event.pixel)[0]
      currentLocation.current = event.coordinate
      if (target) {

        if (markerRef.current) {

          markerRef.current.setPosition(event.coordinate)

        }
        setProperties(target.getProperties())
      }
      if (!target && markerRef.current) {
        markerRef.current.setPosition(undefined)
        currentLocation.current = null
        setProperties(null)
      }

    });
    map?.on('pointermove', (event) => {
      let featureResult = map.getFeaturesAtPixel(event.pixel)
      let target = map.getFeaturesAtPixel(event.pixel)[0]
      if (featureResult.length === 0) {
        layer?.setStyle((feature) => {
          return new Style({
            fill: new Fill({
              color: 'black',
            }),
            stroke: new Stroke({
              color: 'white',
            }),
            text: new Text({
              font: '15px sans-serif',
              justify: 'right',
              fill: new Fill({
                color: 'white',

              }),
              text: feature.get('CNAME')
            })


          })
        })
        return
      }
      if (target) hoverLocation.current = target.getProperties().CACODE
      layer?.setStyle((feature) => {
        return new Style({
          fill: new Fill({
            color: hoverLocation.current === feature.getProperties().CACODE ? 'red' : 'black',
          }),
          stroke: new Stroke({
            color: 'white',
          }),
          text: new Text({
            font: '15px sans-serif',
            justify: 'right',
            fill: new Fill({
              color: 'white',

            }),
            text: feature.get('CNAME')
          })


        })
      })

    });
    return () => {
      map?.removeEventListener('click', () => {
        console.log('bye')
      })

      map?.removeEventListener('click', () => {
        console.log('bye')
      })
    }
  }, [map])

  useEffect(() => {
    fetch('https://geodata.gov.hk/gs/api/v1.0.0/geoDataQuery?q=%7Bv%3A%221%2E0%2E0%22%2Cid%3A%22b545518d-efe1-446d-8525-530b23047aba%22%2Clang%3A%22ALL%22%7D').then(data => data.json()).then(parsedData => {
      startTransition(() => {
        if (deferredQuery !== '') {
          const filteredList = parsedData.features.filter((item: any) => {
          return !!item.properties['Facility Name'].toLowerCase().includes(query) || !!item.properties['設施名稱'].includes(query) || item.properties['District'].toLowerCase().includes(query) || !!item.properties['分區'].includes(query) || !!item.properties['地址'].includes(query) || !!item.properties.Address.toLowerCase().includes(query)
          }).reduce((prev: any, next: any) => {
            if (prev[next.properties.District]) {
              prev[next.properties.District].push(next)
              return prev
            }
            prev[next.properties.District] = [next]
            return prev

          }, {})
        setList(filteredList)
        return
      }
        setList(parsedData.features.reduce((prev: any, next: any) => {
          if (prev[next.properties.District]) {
            prev[next.properties.District].push(next)
            return prev
          }
          prev[next.properties.District] = [next]
          return prev

        }, {}))
      })
    });

  }, [deferredQuery])
  return (
    <div className="container">
      <div style={{
        minWidth: '50%', height: '100vh', display: 'relative'
      }}
        ref={mapRef}
      >
        <Card ref={popupRef} sx={{ maxHeight: '200px', maxWidth: '300px', overflow: 'auto' }}>
          <Table>
            <TableHead>
              <TableCell colSpan={2}>
                Search result:
              </TableCell>
            </TableHead>
            <TableBody>

              {properties && Object.entries(properties).filter(([item]) => item !== 'geometry').map(([key, value], number) =>
                <TableRow key={number}>
                  <TableCell>{key}:</TableCell>
                  <TableCell>{value as string}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
      <Paper sx={{ width: '100%', padding: 3 }}>
        <Typography typography={'h5'}>
          Aided Secondary List
        </Typography>
        <TextField
          fullWidth
          sx={{ marginY: 2 }}
          placeholder='Search'
          value={query}
          onChange={(evt) => setQuery(evt.target.value.toLowerCase())}
        />
        <List sx={{ overflowY: 'scroll', height: '90%', marginBottom: '100px', paddingX: 2 }}>
          {isPending && <div>Loading ...</div>}
          {!isPending && Object.entries(list).map(([key, value]: [string, any]) =>
            <Fragment key={key}>
              <Typography typography={'h5'}>
                {key}
              </Typography>
              {value.map((item: any) => <ListItem key={item.properties.GMID}>

                <Accordion
                  expanded={selectItem === item.properties.GMID}
                  onChange={(evt, expanded) => {
                    if (expanded) {

                      setSelectItem(item.properties.GMID)
                      if (markerRef.current) {
                        markerRef.current.setPosition(fromLonLat(item.geometry.coordinates))
                      }
                      map?.getView().animate({ zoom: 15, center: fromLonLat(item.geometry.coordinates), duration: 1500, easing: () => easeOut(1) })
                      setProperties(item.properties)
                      return
                    }
                    setSelectItem('')
                  }}
                  sx={{ width: '100%' }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}

                  >
                    <Typography>{item.properties['Facility Name']}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography>
                      {Object.entries(item.properties).map(([key, value], number) =>
                        <div style={{ display: 'flex' }} key={number}>
                          <div>{key}:</div>
                          <div>{value as string}</div>
                        </div>)}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              </ListItem>

              )}
            </Fragment>

          )}
        </List>
      </Paper>

    </div>
  )
}

export default App
