package utils

import "testing"

// CompareStringSlicesAsSets compares two string slices as sets, ignoring order and duplicates.
// It reports any differences through the testing.T interface.
func CompareStringSlicesAsSets(t *testing.T, expected, actual []string) {
	t.Helper()

	expectedSet := make(map[string]struct{}, len(expected))
	for _, v := range expected {
		expectedSet[v] = struct{}{}
	}

	actualSet := make(map[string]struct{}, len(actual))
	for _, v := range actual {
		actualSet[v] = struct{}{}
	}

	if len(expectedSet) != len(actualSet) {
		t.Errorf("Expected %d unique values, got %d", len(expectedSet), len(actualSet))
		return
	}

	for v := range actualSet {
		if _, exists := expectedSet[v]; !exists {
			t.Errorf("Unexpected value in result: %s", v)
		}
	}
}
