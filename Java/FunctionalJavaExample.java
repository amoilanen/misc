package functional.examples;

import static fj.data.Array.array;

import org.junit.Assert;
import org.junit.Test;

import fj.F;
import fj.data.Array;

/**
 * Simple demo of using the "functional Java" library. 
 * http://functionaljava.org/
 */
public class FunctionalJavaExample {

    @Test
    public void testArrayTransformation() {
        Assert.assertArrayEquals(new Integer[] {1, 2, 3},
                Array.<String, Integer>map().f(new F<String, Integer>() {

                    @Override
                    public Integer f(String arg) {
                        return arg.length();
                    }
                }).f(array("a", "ab", "abc")).array(Integer[].class));
    }
}