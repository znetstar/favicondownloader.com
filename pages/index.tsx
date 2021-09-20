import {Button, Card, CardContent, FormControl, InputLabel, Link, MenuItem, Select, TextField} from "@mui/material";
import React from "react";
import {ImageFormat, ImageFormatMimeTypes} from "../common/_imageFormats";
import SearchIcon from '@mui/icons-material/Search';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';


export interface HomeProps {
  siteUri?: string;
}

export interface HomeState {
  host: string|null;
  tempHost?: string|null;
  format: ImageFormat;

  tempFormat?: ImageFormat;
  error?: boolean;
  loading?: boolean;
}

export async function getServerSideProps(context: any) {
  const { res } = context;
  return {
    props: {
      siteUri: process.env.SITE_URI
    }
  }
}

const  DEFAULT_FORMAT = ImageFormat.ico;
export class Home extends React.Component<HomeProps, HomeState> {
  public state = {
    host: null,
    tempHost: null,
    format: DEFAULT_FORMAT,
    tempFormat: DEFAULT_FORMAT
  } as HomeState
  constructor(props: HomeProps) {
    super(props);
  }

  get imageLink(): string|null  {
    if  (!this.state.host) return null;
    let base = this.props.siteUri || (document.location.protocol + '//' + document.location.host);
    return base+'/api/favicon/'+this.state.host+'?format='+this.state.format;
  }

  get canSearch() {
    return this.state.tempHost !== this.state.host || this.state.tempFormat !== this.state.format;
  }

  doSearch = () =>  {
    if (this.canSearch)
      this.setState({ loading: true, error: false, host: this.state.tempHost || null, format: this.state.tempFormat || DEFAULT_FORMAT });
  }

  render() {
    return (
      <React.Fragment>
        <div className={"page home"}>
          <header>
            <div>
              <h1>Favicon Downloader</h1>
            </div>
            <div className={"authbar"}>
              <div>
                <div>By <Link target="_blank" href={"https://zb.gy"}>Zachary R.T. Boyd</Link></div>
              </div>
              <div>
                Source is on <Link target="_blank" href={"https://zb.gy/gh/favicondownloader.com"}>GitHub</Link>
              </div>
            </div>
          </header>
          <main>
            <div className={"app-wrapper"}>
              <div>
                <h2>Enter a domain name to download its favicon in any format</h2>
              </div>
              <div className={"form-row"}>
                <FormControl>
                  <InputLabel className={"format-label"} id="demo-simple-select-filled-label">Format</InputLabel>
                  <Select
                    value={this.state.tempFormat}
                    variant="filled"
                    onChange={(e) => this.setState({
                      // @ts-ignore
                      tempFormat: e.target.value as ImageFormat
                    })}
                  >
                    {
                      Array.from(ImageFormatMimeTypes.entries()).map(([  format, mimeType ]) => (
                        <MenuItem key={format.toString().toUpperCase()} value={format}>{format.toString().toUpperCase()}</MenuItem>
                      ))
                    }
                  </Select>
                </FormControl>
                <FormControl style={{  }}>
                  <TextField id="href" label="Domain Name" onKeyDown={(e)=>{
                    if (e.key === 'Enter') {
                      this.doSearch();
                    }
                  }} placeholder={"reason.com"} variant="filled" value={this.state.tempHost} onChange={(e) => {
                    let u = (e.currentTarget.value as string).toLowerCase();
                    if (u.indexOf('//') !== -1) {
                      u = u.split('/')[2] as string;
                    }
                    else if (u.indexOf('/') !== -1) {
                      u = u.split('/')[0] as string;
                    }

                    this.setState({ tempHost: u })
                  }} />
                </FormControl>
              </div>
              <div className={"form-row"}>
                <FormControl>
                  <Button onClick={() => {
                    this.doSearch();
                  }} variant="contained" disabled={this.state.loading || !this.canSearch} endIcon={this.state.loading ? <QueryBuilderIcon/> : <SearchIcon />}>
                    { this.state.loading ? 'Loading' : 'Load' }
                  </Button>
                </FormControl>
              </div>
              {
                this.imageLink ? (
                  <div className={'view-row'}>
                    <div>
                      <Card sx={{ minWidth: 300 }}>
                        <CardContent>
                          <div className={"image-container"}>
                            {
                              !this.state.error ? (
                                this.imageLink ?
                                  <img alt={""} onAbort={() => this.setState({ loading: true })} onChange={() => this.setState({ loading: true })} onLoad={() => this.setState({ loading: false })} onError={() => this.setState({loading: false, error: true })} className={"loaded-image"} src={this.imageLink as string}>
                                  </img> : null
                              ) : (
                                <p>Couldn&apos;t load favicon</p>
                              )
                            }
                          </div>
                        </CardContent>
                      </Card>
                      <p>
                        <div>You can also call the API directly from your code</div>
                        <div><Link className={"image-link"}  target="_blank" href={this.imageLink as string}>{this.imageLink}</Link></div>
                      </p>
                    </div>
                  </div>
                ) : null
              }
            </div>
          </main>
          <footer>

          </footer>
        </div>
      </React.Fragment>
    );
  }
}

export default Home
