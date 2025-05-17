package utils

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCompareStringSlicesAsSets(t *testing.T) {
	tests := []struct {
		name       string
		expected   []string
		actual     []string
		shouldPass bool
	}{
		{
			name:       "identical slices",
			expected:   []string{"a", "b", "c"},
			actual:     []string{"a", "b", "c"},
			shouldPass: true,
		},
		{
			name:       "different order",
			expected:   []string{"a", "b", "c"},
			actual:     []string{"c", "a", "b"},
			shouldPass: true,
		},
		{
			name:       "missing value",
			expected:   []string{"a", "b", "c"},
			actual:     []string{"a", "b"},
			shouldPass: false,
		},
		{
			name:       "extra value",
			expected:   []string{"a", "b"},
			actual:     []string{"a", "b", "c"},
			shouldPass: false,
		},
		{
			name:       "duplicate values",
			expected:   []string{"a", "b", "c"},
			actual:     []string{"a", "b", "b", "c"},
			shouldPass: true,
		},
		{
			name:       "empty slices",
			expected:   []string{},
			actual:     []string{},
			shouldPass: true,
		},
		{
			name:       "nil slices",
			expected:   nil,
			actual:     nil,
			shouldPass: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			subTest := &testing.T{}
			CompareStringSlicesAsSets(subTest, tt.expected, tt.actual)
			if tt.shouldPass {
				assert.False(t, subTest.Failed(), "Expected test to fail but it passed")
			} else {
				assert.True(t, subTest.Failed(), "Expected test to pass but it failed")
			}
		})
	}
}
