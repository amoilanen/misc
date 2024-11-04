export default class Price {
  constructor(
    public time: number,
    public totalPrice: number,
    public priceWithoutVat: number,
    public vatAmount: number
  ) {}
}