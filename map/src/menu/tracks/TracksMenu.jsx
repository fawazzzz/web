import React, { useState, useContext, useEffect, useMemo, useRef } from 'react';
import AppContext from '../../context/AppContext';
import { toHHMMSS } from '../../util/Utils';
import CloudTrackGroup from './CloudTrackGroup';
import GpxCollection from './GpxCollection';
import VisibleGroup from './VisibleGroup';
import _ from 'lodash';
import { AppBar, Box, ClickAwayListener, IconButton, Popper, Toolbar, Tooltip, Typography } from '@mui/material';
import { ReactComponent as ImportIcon } from '../../assets/icons/ic_action_folder_import_outlined.svg';
import { ReactComponent as TimeIcon } from '../../assets/icons/ic_action_time.svg';
import { ReactComponent as CloseIcon } from '../../assets/icons/ic_action_close.svg';
import styles from './trackmenu.module.css';
import { MENU_INFO_CLOSE_SIZE } from '../../manager/GlobalManager';
import LocalGpxUploader from '../../frame/components/util/LocalGpxUploader';
import { useWindowSize } from '../../util/hooks/useWindowSize';
import CloudTrackItem from './CloudTrackItem';
import Actions from './Actions';

export default function TracksMenu() {
    const ctx = useContext(AppContext);
    const [visibleTracks, setVisibleTracks] = useState({ local: [], cloud: [] });
    const [defaultGroup, setDefaultGroup] = useState(null);
    const [openSort, setOpenSort] = useState(false);
    const [sortFiles, setSortFiles] = useState([]);
    const [sortGroups, setSortGroups] = useState([]);
    const anchorEl = useRef(null);
    const [, height] = useWindowSize();
    function visibleTracksOpen() {
        return visibleTracks.local.length > 0 || visibleTracks.cloud.length > 0;
    }

    useEffect(() => {
        if (ctx.gpxFiles) {
            let oldFiles = _.cloneDeep(visibleTracks.cloud);
            visibleTracks.cloud = [];
            Object.values(ctx.gpxFiles).forEach((f) => {
                if (f.url || oldFiles.find((t) => t.name === f.name)) {
                    visibleTracks.cloud.push(f);
                }
            });
        }
        setVisibleTracks({ ...visibleTracks });
    }, [ctx.gpxFiles]);

    useEffect(() => {
        if (ctx.localTracks) {
            let oldFiles = _.cloneDeep(visibleTracks.local);
            visibleTracks.local = [];
            ctx.localTracks.forEach((f) => {
                if (f.selected || oldFiles.find((t) => t.name === f.name)) {
                    visibleTracks.local.push(f);
                }
            });
        }
        setVisibleTracks({ ...visibleTracks });
    }, [ctx.localTracks]);

    // get gpx files and create groups
    useEffect(() => {
        if (!_.isEmpty(ctx.listFiles)) {
            let tg = [];
            let files = (!ctx.listFiles || !ctx.listFiles.uniqueFiles ? [] : ctx.listFiles.uniqueFiles).filter(
                (item) => {
                    return (
                        (item.type === 'gpx' || item.type === 'GPX') &&
                        (item.name.slice(-4) === '.gpx' || item.name.slice(-4) === '.GPX')
                    );
                }
            );
            files.forEach((f) => {
                f.folder = f.name.includes('/') ? f.name.split('/')[0] : 'Tracks';
            });

            files.forEach((f) => {
                let group = tg.find((g) => {
                    return g.name === f.folder;
                });
                if (group) {
                    group.files.push(f);
                } else {
                    tg.push({ name: f.folder, files: [f] });
                }
            });

            if (tg.length > 0) {
                let defGroup = tg.find((g) => {
                    return g.name === 'Tracks';
                });
                if (defGroup) {
                    tg.splice(tg.indexOf(defGroup), 1);
                    setDefaultGroup(defGroup);
                }
            }
            ctx.setTracksGroups(tg);
        } else {
            ctx.setTracksGroups([]);
        }
    }, [ctx.listFiles, ctx.setListFiles]);

    useEffect(() => {
        let resultText = '';
        let dist = 0;
        let tracks = 0;
        let seg = 0;
        let wpts = 0;
        let time = 0;
        let diffUp = 0;
        let diffDown = 0;
        Object.values(ctx.gpxFiles).forEach((item) => {
            if (item.local !== true && item.analysis && item.url) {
                if (item.analysis.totalTracks) {
                    tracks += item.analysis.totalTracks;
                } else {
                    tracks++;
                }
                if (item.analysis.points) {
                    seg += item.analysis.points - 1;
                }
                if (item.analysis.wptPoints) {
                    wpts += item.analysis.wptPoints;
                }
                if (item.analysis.totalDistance) {
                    dist += item.analysis.totalDistance;
                }
                if (item.analysis.timeMoving) {
                    time += item.analysis.timeMoving;
                }
                if (item.analysis.diffElevationUp) {
                    diffUp += item.analysis.diffElevationUp;
                }
                if (item.analysis.diffElevationDown) {
                    diffDown += item.analysis.diffElevationDown;
                }
            }

            if (item.local === true && item.analysis && item.url) {
                if (item.analysis.totalTracks) {
                    tracks += item.analysis.totalTracks;
                } else {
                    tracks++;
                }
                if (item.analysis.wptPoints) {
                    wpts += item.analysis.wptPoints;
                }
                if (item.analysis.totalDistance) {
                    dist += item.analysis.totalDistance;
                }
            }
        });

        Object.values(ctx.localTracks).forEach((item) => {
            if (item.selected) {
                tracks++;
                if (item.points?.length > 0) {
                    dist += item.points[item.points.length - 1].distanceTotal;
                    seg += item.points.length - 1;
                }
            }
        });

        if (tracks > 0) {
            let segInfo = seg > 0 ? `: ${seg} segments` : ``;
            let distInfo = dist > 0 ? `, ${(dist / 1000.0).toFixed(1)} km.` : ``;
            let wptInfo = wpts > 0 ? `, ${wpts} wpts.` : ``;
            let timeInfo = time > 0 ? ` Time moving: ${toHHMMSS(time)}.` : ``;
            let uphillDownhillInfo =
                diffUp > 0 || diffDown ? ` Uphill / Downhill: ${diffUp.toFixed(0)} / ${diffDown.toFixed(0)} m.` : ``;

            resultText = `Selected ${tracks} Tracks${segInfo}${distInfo}${wptInfo}${timeInfo}${uphillDownhillInfo}`;
        }

        ctx.setHeaderText((prevState) => ({
            ...prevState,
            tracks: { text: resultText },
        }));
    }, [visibleTracks, ctx.selectedGpxFile]);

    function closeTrackMenu() {
        ctx.setInfoBlockWidth(MENU_INFO_CLOSE_SIZE);
    }

    const defaultGroupItems = useMemo(() => {
        if (defaultGroup) {
            const items = [];
            (sortFiles.length > 0 ? sortFiles : defaultGroup.files).map((file) => {
                items.push(<CloudTrackItem key={'cloudtrack-' + file.name} file={file} />);
            });
            return items;
        }
    }, [defaultGroup?.files, defaultGroup?.files.length, sortFiles]);

    function openSortDialog() {
        setOpenSort(true);
    }

    const handleClickAway = () => {
        setOpenSort(false);
    };

    return (
        <Box minWidth={ctx.infoBlockWidth} maxWidth={ctx.infoBlockWidth} sx={{ overflow: 'hidden' }}>
            <AppBar position="static" className={styles.appbar}>
                <Toolbar className={styles.toolbar}>
                    <IconButton variant="contained" type="button" className={styles.icon} onClick={closeTrackMenu}>
                        <CloseIcon />
                    </IconButton>
                    <Typography component="div" className={styles.title}>
                        Tracks
                    </Typography>
                    <Tooltip key={'sort_tracks'} title="Sort tracks" arrow placement="bottom-end">
                        <IconButton
                            variant="contained"
                            type="button"
                            className={styles.icon}
                            onClick={openSortDialog}
                            ref={anchorEl}
                        >
                            <TimeIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip key={'import_track'} title="Import track" arrow placement="bottom-end">
                        <span>
                            <LocalGpxUploader>
                                <IconButton component="span" variant="contained" type="button" className={styles.icon}>
                                    <ImportIcon />
                                </IconButton>
                            </LocalGpxUploader>
                        </span>
                    </Tooltip>
                </Toolbar>
            </AppBar>
            <Box
                minWidth={ctx.infoBlockWidth}
                maxWidth={ctx.infoBlockWidth}
                sx={{ overflowX: 'hidden', overflow: 'auto !important', maxHeight: `${height - 120}px` }}
            >
                {ctx.gpxCollection?.length > 0 && <GpxCollection />}
                {visibleTracksOpen() && (
                    <VisibleGroup visibleTracks={visibleTracks} setVisibleTracks={setVisibleTracks} />
                )}
                {ctx.tracksGroups &&
                    (sortGroups.length > 0 ? sortGroups : ctx.tracksGroups).map((group, index) => {
                        return <CloudTrackGroup key={group.name + index} index={index} group={group} />;
                    })}
                {defaultGroupItems}
            </Box>
            <Popper
                sx={{ zIndex: 2000, mt: '-35px !important', ml: '-5px !important' }}
                open={openSort}
                anchorEl={anchorEl.current}
                disablePortal={true}
            >
                <ClickAwayListener onClickAway={handleClickAway}>
                    <Actions
                        files={defaultGroup?.files}
                        setSortFiles={setSortFiles}
                        groups={ctx.tracksGroups}
                        setSortGroups={setSortGroups}
                    />
                </ClickAwayListener>
            </Popper>
        </Box>
    );
}
