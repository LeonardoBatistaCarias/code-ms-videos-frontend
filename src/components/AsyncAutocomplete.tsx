import * as React from 'react';
import {Autocomplete, AutocompleteProps, UseAutocompleteSingleProps} from "@material-ui/lab";
import { CircularProgress, TextField, TextFieldProps } from '@material-ui/core';
import {useState, useEffect} from 'react';
import { useSnackbar } from 'notistack';
import { useDebounce } from 'use-debounce/lib';
import {RefAttributes, forwardRef} from "react";

interface AsyncAutocompleteProps extends RefAttributes<AsyncAutocompleteComponent> {
    fetchOptions: (searchText) => Promise<any>;
    debounceTime?: number;
    TextFieldProps?: TextFieldProps;
    AutocompleteProps?: Omit<AutocompleteProps<any>, 'renderInput'> & UseAutocompleteSingleProps<any>;
}

export interface AsyncAutocompleteComponent {
    clear: () => void;
}

const AsyncAutocomplete = forwardRef<AsyncAutocompleteComponent, AsyncAutocompleteProps> ((props, ref) => {
    
    const {AutocompleteProps, debounceTime = 300} = props;
    const {freeSolo = false, onOpen, onClose, onInputChange} = AutocompleteProps as any;
    const [open, setOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [debouncedSearchText] = useDebounce(searchText, debounceTime);
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState([]);

    const snackbar = useSnackbar();
    
    const textFieldProps : TextFieldProps ={
        margin: 'normal',
        variant: 'outlined',
        fullWidth: true,
        InputLabelProps: {shrink: true},
        ...(props.TextFieldProps && {...props.TextFieldProps})
    };

    const autocompleteProps: AutocompleteProps<any> = {
        loadingText: "Carregando...",
        noOptionsText: "Nenhum item encontrado",
        ...(AutocompleteProps && {...AutocompleteProps}),
        open,
        options,
        loading: loading,        
        onOpen() {
            setOpen(true);
            onOpen && onOpen();
        },
        onClose() {
            setOpen(false);
            onClose && onClose();
        },
        onInputChange(event, value) {
            setSearchText(value);
            onInputChange && onInputChange();
        },
        renderInput: params => {
            return <TextField
                {...params}
                {...textFieldProps}
                InputProps={
                    {
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {loading && <CircularProgress color={"inherit"} size={20} />}
                                {params.InputProps.endAdornment}
                            </>                            
                        )
                    }
                }
            />
        }
    };

    useEffect(() => {
        if(!open || debouncedSearchText === "" && freeSolo) {
            return;
        }

        let isSubscribed = true;
        (async() => {
            setLoading(true);
            try {                
                const data = await props.fetchOptions(debouncedSearchText);
                if(isSubscribed) {
                    setOptions(data);
                }
            } finally {
                setLoading(false);
            }            
        })();

        return () => {
            isSubscribed = false;
        };
        
    }, [freeSolo ? debouncedSearchText : open]);

    return (
        <Autocomplete {...autocompleteProps}/>
    );
});

export default AsyncAutocomplete;