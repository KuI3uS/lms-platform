public class Main {

    public static final int N = 100;


    public static void wypelnijTablice(boolean[] liczbyPierwsze) {
        for (int i = 2; i < liczbyPierwsze.length; i++) {
            liczbyPierwsze[i] = true;
        }
    }

    public static void main(String[] args) {
        boolean[] liczbyPierwsze = new boolean[N + 1];

        wypelnijTablice(liczbyPierwsze);

        for (int i = 2; i <= Math.sqrt(N); i++) {
            if (liczbyPierwsze[i]) {
                for (int j = 2 * i; j <= N; j += i) {
                    liczbyPierwsze[j] = false;
                }
            }
        }

        System.out.println("Liczby pierwsze z przedzialu od 2 do 100:");

        for (int i = 2; i <= N; i++) {
            if (liczbyPierwsze[i]) {
                System.out.print(i + " ");
            }
        }
    }
}