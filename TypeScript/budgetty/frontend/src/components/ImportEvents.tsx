import React, { useState, useRef } from 'react';
import {
  Button,
  Box,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  AlertTitle,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { DateFormat } from '../types';

interface ImportConfigFormData {
  dateColumn: string;
  amountColumn: string;
  descriptionColumn: string;
  dateFormat: DateFormat;
  delimiter: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  skippedMissingDate: number;
  errors: string[];
}

const ImportEvents: React.FC = () => {
  const { getToken } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [dateColumn, setDateColumn] = useState('');
  const [amountColumn, setAmountColumn] = useState('');
  const [descriptionColumn, setDescriptionColumn] = useState('');
  const [dateFormat, setDateFormat] = useState<DateFormat>(DateFormat.DD_MM_YYYY);
  const [delimiter, setDelimiter] = useState(';');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      
      // Read headers from CSV
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const firstLine = text.split('\n')[0];
        const headers = firstLine.split(delimiter);
        setHeaders(headers);
      };
      reader.readAsText(selectedFile);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('dateColumn', dateColumn);
    formData.append('amountColumn', amountColumn);
    formData.append('descriptionColumn', descriptionColumn);
    formData.append('dateFormat', dateFormat);
    formData.append('delimiter', delimiter);

    try {
      const token = await getToken();
      const response = await fetch('/api/events/import', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const result = await response.json();
      setImportResult(result);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        imported: 0,
        skipped: 0,
        skippedMissingDate: 0,
        errors: ['Failed to import events. Please try again.'],
      });
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box
            sx={{
              border: '2px dashed',
              borderColor: 'primary.main',
              borderRadius: 1,
              p: 3,
              textAlign: 'center',
              backgroundColor: 'action.hover',
              cursor: 'pointer',
              mb: 2,
              minWidth: '100%',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              ref={fileInputRef}
            />
            {file ? (
              <Typography variant="body1" color="primary">
                Selected file: {file.name}
              </Typography>
            ) : (
              <Typography variant="body1" color="textSecondary">
                Click to select a CSV file or drag and drop
              </Typography>
            )}
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box
            sx={{
              backgroundColor: 'background.paper',
              borderRadius: 1,
              p: 3,
              boxShadow: 1,
              mb: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              CSV Configuration
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ minWidth: '300px' }}>
                  <InputLabel id="date-column-label">Date Column</InputLabel>
                  <Select
                    labelId="date-column-label"
                    value={dateColumn}
                    onChange={(e) => setDateColumn(e.target.value)}
                    label="Date Column"
                    size="medium"
                  >
                    {headers.map((header) => (
                      <MenuItem key={header} value={header}>
                        {header}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ minWidth: '300px' }}>
                  <InputLabel id="amount-column-label">Amount Column</InputLabel>
                  <Select
                    labelId="amount-column-label"
                    value={amountColumn}
                    onChange={(e) => setAmountColumn(e.target.value)}
                    label="Amount Column"
                    size="medium"
                  >
                    {headers.map((header) => (
                      <MenuItem key={header} value={header}>
                        {header}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ minWidth: '300px' }}>
                  <InputLabel id="description-column-label">Description Column</InputLabel>
                  <Select
                    labelId="description-column-label"
                    value={descriptionColumn}
                    onChange={(e) => setDescriptionColumn(e.target.value)}
                    label="Description Column"
                    size="medium"
                  >
                    {headers.map((header) => (
                      <MenuItem key={header} value={header}>
                        {header}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ minWidth: '300px' }}>
                  <InputLabel id="date-format-label">Date Format</InputLabel>
                  <Select
                    labelId="date-format-label"
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value as DateFormat)}
                    label="Date Format"
                    size="medium"
                  >
                    <MenuItem value={DateFormat.DD_MM_YYYY}>DD/MM/YYYY</MenuItem>
                    <MenuItem value={DateFormat.MM_DD_YYYY}>MM/DD/YYYY</MenuItem>
                    <MenuItem value={DateFormat.YYYY_MM_DD}>YYYY/MM/DD</MenuItem>
                    <MenuItem value={DateFormat.DD_MM_YY}>DD/MM/YY</MenuItem>
                    <MenuItem value={DateFormat.MM_DD_YY}>MM/DD/YY</MenuItem>
                    <MenuItem value={DateFormat.YY_MM_DD}>YY/MM/DD</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ minWidth: '300px' }}>
                  <InputLabel id="delimiter-label">Delimiter</InputLabel>
                  <Select
                    labelId="delimiter-label"
                    value={delimiter}
                    onChange={(e) => setDelimiter(e.target.value)}
                    label="Delimiter"
                    size="medium"
                  >
                    <MenuItem value=",">,</MenuItem>
                    <MenuItem value=";">;</MenuItem>
                    <MenuItem value="|">|</MenuItem>
                    <MenuItem value="\t">Tab</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={!file || !dateColumn || !amountColumn || !descriptionColumn}
            sx={{ mt: 1, py: 1.5, minWidth: '300px' }}
          >
            Import Events
          </Button>
        </Grid>
      </Grid>

      {importResult && (
        <Box mt={2}>
          <Alert
            severity={importResult.errors.length > 0 ? 'warning' : 'success'}
            action={
              <Button color="inherit" size="small" onClick={() => setImportResult(null)}>
                Close
              </Button>
            }
          >
            <AlertTitle>
              {importResult.errors.length > 0 ? 'Import Completed with Warnings' : 'Import Successful'}
            </AlertTitle>
            <Typography variant="body2">
              Imported {importResult.imported} records
              {importResult.skipped > 0 && `, skipped ${importResult.skipped} records`}
              {importResult.skippedMissingDate > 0 && ` (${importResult.skippedMissingDate} due to missing dates)`}
            </Typography>
            {importResult.errors.length > 0 && (
              <Box mt={1}>
                <Typography variant="body2" color="error">
                  Errors encountered:
                </Typography>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  {importResult.errors.map((error, index) => (
                    <li key={index}>
                      <Typography variant="body2" color="error">
                        {error}
                      </Typography>
                    </li>
                  ))}
                </ul>
              </Box>
            )}
          </Alert>
        </Box>
      )}
    </form>
  );
};

export default ImportEvents; 