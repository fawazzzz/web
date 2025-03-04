import React, { forwardRef, useContext, useState } from 'react';
import { Box, Divider, ListItemIcon, ListItemText, MenuItem, Paper, Typography } from '@mui/material';
import styles from '../trackfavmenu.module.css';
import { ReactComponent as ShowOnMapIcon } from '../../assets/icons/ic_show_on_map_outlined.svg';
import { ReactComponent as DownloadIcon } from '../../assets/icons/ic_action_gsave_dark.svg';
import { ReactComponent as DeleteIcon } from '../../assets/icons/ic_action_delete_outlined.svg';
import { ReactComponent as RenameIcon } from '../../assets/icons/ic_action_edit_outlined.svg';
import { ReactComponent as DuplicateIcon } from '../../assets/icons/ic_action_copy.svg';
import DeleteTrackDialog from '../../dialogs/tracks/DeleteTrackDialog';
import Utils from '../../util/Utils';
import TracksManager from '../../manager/track/TracksManager';
import RenameDialog from '../../dialogs/tracks/RenameDialog';
import AppContext from '../../context/AppContext';
import { duplicateTrack } from '../../manager/track/SaveTrackManager';

const TrackActions = forwardRef(({ track, setShowTrack, setOpenActions }, ref) => {
    const ctx = useContext(AppContext);

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openRenameDialog, setOpenRenameDialog] = useState(false);
    const downloadGpx = async () => {
        const urlFile = `${process.env.REACT_APP_USER_API_SITE}/mapapi/download-file`;
        const qs = `?type=${encodeURIComponent(track.type)}&name=${encodeURIComponent(track.name)}`;
        const oneGpxFile = {
            url: urlFile + qs,
            clienttimems: track.clienttimems,
            updatetimems: track.updatetimems,
            name: track.name,
            type: 'GPX',
        };
        const data = await Utils.getFileData(oneGpxFile);
        if (data) {
            const url = document.createElement('a');
            url.href = URL.createObjectURL(new Blob([data]));
            url.download = `${TracksManager.prepareName(track.name)}.gpx`;
            url.click();
        }
    };

    async function createDuplicateTrack() {
        const parts = track.name.split('/');
        const newName = parts.pop();
        await duplicateTrack(track.name, parts.join('/'), TracksManager.prepareName(newName), ctx).then();
        if (setOpenActions) {
            setOpenActions(false);
        }
    }

    return (
        <>
            <Box ref={ref}>
                <Paper id="se-track-actions" className={styles.actions}>
                    <MenuItem
                        className={styles.action}
                        onClick={() => {
                            setShowTrack(true);
                            setOpenActions(false);
                        }}
                    >
                        <ListItemIcon className={styles.iconAction}>
                            <ShowOnMapIcon />
                        </ListItemIcon>
                        <ListItemText>
                            <Typography variant="inherit" className={styles.actionName} noWrap>
                                Show on map
                            </Typography>
                        </ListItemText>
                    </MenuItem>
                    <Divider className={styles.dividerActions} />
                    <MenuItem
                        id={'se-rename-cloud-track'}
                        className={styles.action}
                        onClick={() => setOpenRenameDialog(true)}
                    >
                        <ListItemIcon className={styles.iconAction}>
                            <RenameIcon />
                        </ListItemIcon>
                        <ListItemText>
                            <Typography variant="inherit" className={styles.actionName} noWrap>
                                Rename
                            </Typography>
                        </ListItemText>
                    </MenuItem>
                    <Divider className={styles.dividerActions} />
                    <MenuItem
                        id={'se-duplicate-cloud-track'}
                        className={styles.action}
                        onClick={() => createDuplicateTrack()}
                    >
                        <ListItemIcon className={styles.iconAction}>
                            <DuplicateIcon />
                        </ListItemIcon>
                        <ListItemText>
                            <Typography variant="inherit" className={styles.actionName} noWrap>
                                Duplicate
                            </Typography>
                        </ListItemText>
                    </MenuItem>
                    <Divider className={styles.dividerActions} />
                    <MenuItem
                        className={styles.action}
                        onClick={() => {
                            downloadGpx().then();
                            setOpenActions(false);
                        }}
                    >
                        <ListItemIcon className={styles.iconAction}>
                            <DownloadIcon />
                        </ListItemIcon>
                        <ListItemText>
                            <Typography variant="inherit" className={styles.actionName} noWrap>
                                Download
                            </Typography>
                        </ListItemText>
                    </MenuItem>
                    <Divider className={styles.dividerActions} />
                    <MenuItem
                        id={'se-delete-cloud-track'}
                        className={styles.action}
                        onClick={() => setOpenDeleteDialog(true)}
                    >
                        <ListItemIcon className={styles.iconAction}>
                            <DeleteIcon />
                        </ListItemIcon>
                        <ListItemText>
                            <Typography variant="inherit" className={styles.actionName} noWrap>
                                Delete
                            </Typography>
                        </ListItemText>
                    </MenuItem>
                </Paper>
            </Box>
            {openDeleteDialog && (
                <DeleteTrackDialog
                    dialogOpen={openDeleteDialog}
                    setDialogOpen={setOpenDeleteDialog}
                    file={track}
                    setOpenActions={setOpenActions}
                />
            )}
            {openRenameDialog && (
                <RenameDialog setOpenDialog={setOpenRenameDialog} track={track} setOpenActions={setOpenActions} />
            )}
        </>
    );
});

TrackActions.displayName = 'TrackActions';
export default TrackActions;
