import React, { useState } from 'react';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import { useFormikContext } from 'formik';
import Fade from '@/components/elements/Fade';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileArchive, faLevelUpAlt, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import useFlash from '@/plugins/useFlash';
import compressFiles from '@/api/server/files/compressFiles';
import useServer from '@/plugins/useServer';
import { ServerContext } from '@/state/server';
import ConfirmationModal from '@/components/elements/ConfirmationModal';
import deleteFiles from '@/api/server/files/deleteFiles';

const MassActionsBar = () => {
    const { uuid } = useServer();
    const { mutate } = useFileManagerSwr();
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [ loading, setLoading ] = useState(false);
    const [ showConfirm, setShowConfirm ] = useState(false);
    const { values, setFieldValue } = useFormikContext<{ selectedFiles: string[] }>();
    const directory = ServerContext.useStoreState(state => state.files.directory);

    const onClickCompress = () => {
        setLoading(true);
        clearFlashes('files');

        compressFiles(uuid, directory, values.selectedFiles)
            .then(() => mutate())
            .then(() => setFieldValue('selectedFiles', []))
            .catch(error => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setLoading(false));
    };

    const onClickConfirmDeletion = () => {
        setLoading(true);
        setShowConfirm(false);
        clearFlashes('files');

        deleteFiles(uuid, directory, values.selectedFiles)
            .then(() => {
                mutate(files => files.filter(f => values.selectedFiles.indexOf(f.name) < 0), false);
                setFieldValue('selectedFiles', []);
            })
            .catch(error => {
                mutate();
                clearAndAddHttpError({ key: 'files', error });
            })
            .then(() => setLoading(false));
    };

    return (
        <Fade timeout={75} in={values.selectedFiles.length > 0} unmountOnExit>
            <div css={tw`fixed bottom-0 z-50 left-0 right-0 flex justify-center`}>
                <SpinnerOverlay visible={loading} size={'large'} fixed/>
                <ConfirmationModal
                    visible={showConfirm}
                    title={'Delete these files?'}
                    buttonText={'Yes, Delete Files'}
                    onConfirmed={onClickConfirmDeletion}
                    onDismissed={() => setShowConfirm(false)}
                >
                    Deleting files is a permanent operation, you cannot undo this action.
                </ConfirmationModal>
                <div css={tw`rounded p-4 mb-6`} style={{ background: 'rgba(0, 0, 0, 0.35)' }}>
                    <Button size={'xsmall'} css={tw`mr-4`}>
                        <FontAwesomeIcon icon={faLevelUpAlt} css={tw`mr-2`}/> Move
                    </Button>
                    <Button
                        size={'xsmall'}
                        css={tw`mr-4`}
                        onClick={onClickCompress}
                    >
                        <FontAwesomeIcon icon={faFileArchive} css={tw`mr-2`}/> Archive
                    </Button>
                    <Button size={'xsmall'} color={'red'} isSecondary onClick={() => setShowConfirm(true)}>
                        <FontAwesomeIcon icon={faTrashAlt} css={tw`mr-2`}/> Delete
                    </Button>
                </div>
            </div>
        </Fade>
    );
};

export default MassActionsBar;
