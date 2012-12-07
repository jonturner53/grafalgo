IDIR = ../../include
LDIR = ../../lib
LIB = ${LDIR}/lib-ds.a
CC = g++
CXXFLAGS = -O2 -m64 -Wall -I ${IDIR}
.cpp.o:
	${CXX} ${CXXFLAGS} -c $<

Dheap.o :   ${IDIR}/stdinc.h ${IDIR}/Dheap.h
Lheaps.o :  ${IDIR}/stdinc.h ${IDIR}/Lheaps.h
Llheaps.o : ${IDIR}/stdinc.h ${IDIR}/Llheaps.h
Fheaps.o :  ${IDIR}/stdinc.h ${IDIR}/Fheaps.h

all :	Dheap.o Lheaps.o Llheaps.o Fheaps.o 
	ar -ru ${LIB} Dheap.o Lheaps.o Llheaps.o Fheaps.o 

clean:
	rm -f *.o
	#make -C dvr clean
