//clear && rustc inheritance-demo.rs && ./inheritance-demo && rm ./inheritance-demo

use std::f32::consts;

struct Point {
    x: f32,
    y: f32
}

struct Segment {
    start: &'static Point,
    length: f32
}

struct Circle {
    center: &'static Point,
    radius: f32
}

struct Rectangle {
    left_bottom: &'static Point,
    width: f32,
    height: f32
}

struct Square {
    left_bottom: &'static Point,
    side: f32
}

impl Square {
    fn as_rectangle(&self) -> Rectangle {
        Rectangle {
            left_bottom: self.left_bottom,
            width: self.side,
            height: self.side
        }
    }
}

trait Shape {
    fn display(&self) -> String;
}

trait HavingPerimeter: Shape {
    fn perimeter(&self) -> f32;
}

trait HavingArea: HavingPerimeter {
    fn area(&self) -> f32;
}

impl Shape for Point {
    fn display(&self) -> String {
        format!("Point({}, {})", self.x, self.y)
    }
}

impl Shape for Segment {
    fn display(&self) -> String {
        format!("Segment(start={}, length={})", self.start.display(), self.length)
    }
}

impl HavingPerimeter for Segment {
    fn perimeter(&self) -> f32 {
        self.length
    }
}

impl Shape for Circle {
    fn display(&self) -> String {
        format!("Circle(center={}, radius={})", self.center.display(), self.radius)
    }
}

impl HavingPerimeter for Circle {
    fn perimeter(&self) -> f32 {
        2.0 * consts::PI * self.radius
    }
}

impl HavingArea for Circle {
    fn area(&self) -> f32 {
        consts::PI * self.radius * self.radius
    }
}

impl Shape for Rectangle {
    fn display(&self) -> String {
        let right_bottom = Point {
            x: self.left_bottom.x + self.width as f32,
            y: self.left_bottom.y
        };
        let left_top = Point {
            x: self.left_bottom.x,
            y: self.left_bottom.y + self.height as f32
        };
        let right_top = Point {
            x: self.left_bottom.x + self.width as f32,
            y: self.left_bottom.y + self.height as f32
        };
        format!("Rectangle({}, {}, {}, {})",
                self.left_bottom.display(),
                left_top.display(),
                right_top.display(),
                right_bottom.display()
        )
    }
}

impl HavingPerimeter for Rectangle {
    fn perimeter(&self) -> f32 {
        2.0 * (self.width + self.height)
    }
}

impl HavingArea for Rectangle {
    fn area(&self) -> f32 {
        self.width * self.height
    }
}

impl Shape for Square {
  fn display(&self) -> String {
      self.as_rectangle().display()
  }
}

impl HavingPerimeter for Square {
    fn perimeter(&self) -> f32 {
        self.as_rectangle().perimeter()
    }
}

impl HavingArea for Square {
    fn area(&self) -> f32 {
        self.as_rectangle().area()
    }
}

fn main() {
    let p = Point {
        x: 10.0,
        y: 25.0
    };
    println!("{}", p.display());
    let s = Segment {
        start: &Point {
            x: 5.0,
            y: 5.0
        },
        length: 10.0
    };
    println!("{}, perimeter {}", s.display(), s.perimeter());
    let c = Circle {
        center: &Point {
            x: 30.0,
            y: 40.0
        },
        radius: 5.0
    };
    println!("{}, perimeter {}, area {}", c.display(), c.perimeter(), c.area());
    let r = Rectangle {
        left_bottom: &Point {
            x: 10.0,
            y: 10.0
        },
        width: 20.0,
        height: 30.0
    };
    println!("{}, perimeter {}, area {}", r.display(), r.perimeter(), r.area());
    let sq = Square {
        left_bottom: &Point {
            x: 5.0,
            y: 5.0
        },
        side: 10.0
    };
    println!("{}, perimeter {}, area {}", sq.display(), sq.perimeter(), sq.area())
}
